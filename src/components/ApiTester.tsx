'use client';

import { useState, useCallback } from 'react';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
type TabKey = 'params' | 'headers' | 'body' | 'auth';
type ResponseTab = 'body' | 'headers' | 'info';
type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

interface KeyValue { id: string; key: string; value: string; enabled: boolean; }
interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: string;
}

const METHOD_COLORS: Record<Method, string> = {
  GET: '#3dd68c', POST: '#6e6af0', PUT: '#f0a940', PATCH: '#f06464',
  DELETE: '#f06464', HEAD: '#89ddff', OPTIONS: '#c792ea'
};

function uid() { return Math.random().toString(36).slice(2, 8); }
function emptyKV(): KeyValue { return { id: uid(), key: '', value: '', enabled: true }; }

function syntaxHighlight(json: string): string {
  try { json = JSON.stringify(JSON.parse(json), null, 2); } catch {}
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, match => {
      let cls = 'json-number';
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-key' : 'json-string';
      else if (/true|false/.test(match)) cls = 'json-bool';
      else if (/null/.test(match)) cls = 'json-null';
      return `<span class="${cls}">${match}</span>`;
    });
}

function statusColor(code: number): string {
  if (code < 300) return 'var(--success)';
  if (code < 400) return 'var(--warning)';
  return 'var(--error)';
}

const PRESETS = [
  { label: 'JSONPlaceholder post', method: 'GET' as Method, url: 'https://jsonplaceholder.typicode.com/posts/1' },
  { label: 'JSONPlaceholder users', method: 'GET' as Method, url: 'https://jsonplaceholder.typicode.com/users' },
  { label: 'HTTPBin GET', method: 'GET' as Method, url: 'https://httpbin.org/get' },
  { label: 'HTTPBin POST', method: 'POST' as Method, url: 'https://httpbin.org/post' },
];

export default function ApiTester() {
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState<TabKey>('params');
  const [respTab, setRespTab] = useState<ResponseTab>('body');
  const [params, setParams] = useState<KeyValue[]>([emptyKV()]);
  const [headers, setHeaders] = useState<KeyValue[]>([emptyKV()]);
  const [body, setBody] = useState('');
  const [authType, setAuthType] = useState<AuthType>('none');
  const [bearerToken, setBearerToken] = useState('');
  const [basicUser, setBasicUser] = useState('');
  const [basicPass, setBasicPass] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState('');

  const buildUrl = useCallback(() => {
    if (!url) return '';
    const active = params.filter(p => p.enabled && p.key);
    if (!active.length) return url;
    const base = url.split('?')[0];
    const qs = active.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    return `${base}?${qs}`;
  }, [url, params]);

  const send = async () => {
    const finalUrl = buildUrl();
    if (!finalUrl) return;
    setLoading(true);
    setError('');
    setResponse(null);
    const start = performance.now();
    try {
      const reqHeaders: Record<string, string> = {};
      headers.filter(h => h.enabled && h.key).forEach(h => { reqHeaders[h.key] = h.value; });
      if (authType === 'bearer' && bearerToken) reqHeaders['Authorization'] = `Bearer ${bearerToken}`;
      if (authType === 'basic' && basicUser) reqHeaders['Authorization'] = `Basic ${btoa(`${basicUser}:${basicPass}`)}`;
      if (authType === 'apikey' && apiKey) reqHeaders[apiKeyHeader] = apiKey;
      const opts: RequestInit = { method, headers: reqHeaders };
      if (!['GET', 'HEAD'].includes(method) && body) {
        opts.body = body;
        if (!reqHeaders['Content-Type']) reqHeaders['Content-Type'] = 'application/json';
      }
      const res = await fetch(finalUrl, opts);
      const elapsed = Math.round(performance.now() - start);
      const text = await res.text();
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });
      const bytes = new TextEncoder().encode(text).length;
      const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
      setResponse({ status: res.status, statusText: res.statusText, headers: resHeaders, body: text, time: elapsed, size });
      setRespTab('body');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateKV = (list: KeyValue[], setList: (l: KeyValue[]) => void, id: string, field: keyof KeyValue, val: string | boolean) => {
    const updated = list.map(item => item.id === id ? { ...item, [field]: val } : item);
    if (field === 'key' && val !== '' && !updated.some(i => i.key === '' && i.id !== id)) {
      updated.push(emptyKV());
    }
    setList(updated);
  };

  const removeKV = (list: KeyValue[], setList: (l: KeyValue[]) => void, id: string) => {
    const filtered = list.filter(i => i.id !== id);
    if (!filtered.length) filtered.push(emptyKV());
    setList(filtered);
  };

  const loadPreset = (p: typeof PRESETS[0]) => {
    setMethod(p.method);
    setUrl(p.url);
    setParams([emptyKV()]);
  };

  const activeCount = (list: KeyValue[]) => list.filter(i => i.enabled && i.key).length;

  const isJson = (s: string) => { try { JSON.parse(s); return true; } catch { return false; } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      <style>{`
        .json-key { color: #c792ea; }
        .json-string { color: #c3e88d; }
        .json-number { color: #f78c6c; }
        .json-bool { color: #89ddff; }
        .json-null { color: #546e7a; }
        .api-input { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-family: inherit; font-size: 13px; padding: 8px 12px; border-radius: 6px; outline: none; width: 100%; }
        .api-input:focus { border-color: var(--border-bright); }
        .api-input::placeholder { color: #44446688; }
        .tab-btn { background: none; border: none; color: var(--text-secondary); padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
        .tab-btn:hover { color: var(--text-primary); }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
        .tab-badge { background: var(--accent-dim); color: var(--accent); font-size: 10px; padding: 1px 5px; border-radius: 10px; margin-left: 4px; }
        .send-btn { background: var(--accent); border: none; color: white; padding: 0 24px; height: 40px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; white-space: nowrap; }
        .send-btn:hover:not(:disabled) { background: var(--accent-hover); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .kv-row { display: grid; grid-template-columns: 20px 1fr 1fr 28px; gap: 6px; align-items: center; margin-bottom: 4px; }
        .kv-input { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-family: var(--font-mono); font-size: 12px; padding: 6px 10px; border-radius: 5px; outline: none; width: 100%; }
        .kv-input:focus { border-color: var(--border-bright); }
        .kv-input::placeholder { color: #44446688; }
        .rm-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 16px; line-height: 1; padding: 4px; border-radius: 4px; }
        .rm-btn:hover { color: var(--error); background: var(--error-dim); }
        .method-select { background: var(--bg-elevated); border: 1px solid var(--border); padding: 0 12px; height: 40px; border-radius: 8px 0 0 8px; font-size: 13px; font-weight: 700; outline: none; cursor: pointer; border-right: none; font-family: inherit; }
        .auth-input { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-family: var(--font-mono); font-size: 12px; padding: 8px 12px; border-radius: 6px; outline: none; width: 100%; margin-bottom: 8px; }
        .auth-input:focus { border-color: var(--border-bright); }
        textarea.body-input { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-family: var(--font-mono); font-size: 12px; padding: 12px; border-radius: 6px; outline: none; width: 100%; resize: vertical; min-height: 140px; }
        textarea.body-input:focus { border-color: var(--border-bright); }
        .preset-btn { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-secondary); padding: 4px 10px; border-radius: 5px; font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.12s; }
        .preset-btn:hover { border-color: var(--accent); color: var(--accent); }
        .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); margin-bottom: 10px; }
      `}</style>

      {/* URL Bar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {PRESETS.map(p => (
            <button key={p.label} className="preset-btn" onClick={() => loadPreset(p)}>{p.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0' }}>
          <select
            className="method-select"
            value={method}
            onChange={e => setMethod(e.target.value as Method)}
            style={{ color: METHOD_COLORS[method] }}
          >
            {(['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'] as Method[]).map(m => (
              <option key={m} value={m} style={{ color: METHOD_COLORS[m] }}>{m}</option>
            ))}
          </select>
          <input
            className="api-input"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="https://api.example.com/endpoint"
            style={{ borderRadius: '0', borderRight: 'none', flex: 1 }}
          />
          <button className="send-btn" onClick={send} disabled={loading || !url} style={{ borderRadius: '0 8px 8px 0' }}>
            {loading ? (
              <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>↻</span>
            ) : 'Send →'}
          </button>
        </div>
        {buildUrl() !== url && url && (
          <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            → {buildUrl()}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0 }}>
        {/* Request Config */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px', background: 'var(--bg-secondary)' }}>
            {(['params', 'headers', 'body', 'auth'] as TabKey[]).map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t}
                {t === 'params' && activeCount(params) > 0 && <span className="tab-badge">{activeCount(params)}</span>}
                {t === 'headers' && activeCount(headers) > 0 && <span className="tab-badge">{activeCount(headers)}</span>}
                {t === 'auth' && authType !== 'none' && <span className="tab-badge">✓</span>}
              </button>
            ))}
          </div>
          <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
            {(tab === 'params' || tab === 'headers') && (
              <KVEditor
                list={tab === 'params' ? params : headers}
                setList={tab === 'params' ? setParams : setHeaders}
                updateKV={updateKV}
                removeKV={removeKV}
                keyPlaceholder={tab === 'params' ? 'parameter' : 'Header-Name'}
                valPlaceholder={tab === 'params' ? 'value' : 'value'}
              />
            )}
            {tab === 'body' && (
              <div>
                <div className="section-label">Request Body</div>
                <textarea
                  className="body-input"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={'{\n  "key": "value"\n}'}
                  rows={12}
                  spellCheck={false}
                />
              </div>
            )}
            {tab === 'auth' && (
              <AuthConfig
                authType={authType} setAuthType={setAuthType}
                bearerToken={bearerToken} setBearerToken={setBearerToken}
                basicUser={basicUser} setBasicUser={setBasicUser}
                basicPass={basicPass} setBasicPass={setBasicPass}
                apiKey={apiKey} setApiKey={setApiKey}
                apiKeyHeader={apiKeyHeader} setApiKeyHeader={setApiKeyHeader}
              />
            )}
          </div>
        </div>

        {/* Response */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0 16px', background: 'var(--bg-secondary)', gap: '8px' }}>
            {(['body', 'headers', 'info'] as ResponseTab[]).map(t => (
              <button key={t} className={`tab-btn ${respTab === t ? 'active' : ''}`} onClick={() => setRespTab(t)}>{t}</button>
            ))}
            {response && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: statusColor(response.status) }}>
                  {response.status} {response.statusText}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{response.time}ms</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{response.size}</span>
              </div>
            )}
          </div>

          <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
            {loading && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', fontSize: '16px' }}>↻</span>
                Sending request...
              </div>
            )}
            {error && !loading && (
              <div>
                <div style={{ color: 'var(--error)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Request Failed</div>
                <div style={{ color: 'var(--error)', fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: 0.8 }}>{error}</div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Common causes: CORS policy, network error, invalid URL. Try a CORS-friendly API like httpbin.org.
                </div>
              </div>
            )}
            {response && !loading && (
              <>
                {respTab === 'body' && (
                  <div>
                    {isJson(response.body) ? (
                      <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                        dangerouslySetInnerHTML={{ __html: syntaxHighlight(response.body) }} />
                    ) : (
                      <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {response.body}
                      </pre>
                    )}
                  </div>
                )}
                {respTab === 'headers' && (
                  <div>
                    {Object.entries(response.headers).map(([k, v]) => (
                      <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 500 }}>{k}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {respTab === 'info' && (
                  <div style={{ fontSize: '13px', lineHeight: 2 }}>
                    <InfoRow label="Status" value={`${response.status} ${response.statusText}`} color={statusColor(response.status)} />
                    <InfoRow label="Time" value={`${response.time}ms`} />
                    <InfoRow label="Size" value={response.size} />
                    <InfoRow label="Content-Type" value={response.headers['content-type'] || '—'} />
                    <InfoRow label="URL" value={buildUrl()} mono />
                  </div>
                )}
              </>
            )}
            {!response && !loading && !error && (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', paddingTop: '8px' }}>
                Send a request to see the response
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function KVEditor({ list, setList, updateKV, removeKV, keyPlaceholder, valPlaceholder }: {
  list: KeyValue[];
  setList: (l: KeyValue[]) => void;
  updateKV: (list: KeyValue[], setList: (l: KeyValue[]) => void, id: string, field: keyof KeyValue, val: string | boolean) => void;
  removeKV: (list: KeyValue[], setList: (l: KeyValue[]) => void, id: string) => void;
  keyPlaceholder: string;
  valPlaceholder: string;
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 1fr 28px', gap: '6px', marginBottom: '6px' }}>
        <span /><span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Key</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Value</span><span />
      </div>
      {list.map(item => (
        <div key={item.id} className="kv-row">
          <input type="checkbox" checked={item.enabled} onChange={e => updateKV(list, setList, item.id, 'enabled', e.target.checked)} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
          <input className="kv-input" value={item.key} onChange={e => updateKV(list, setList, item.id, 'key', e.target.value)} placeholder={keyPlaceholder} />
          <input className="kv-input" value={item.value} onChange={e => updateKV(list, setList, item.id, 'value', e.target.value)} placeholder={valPlaceholder} />
          <button className="rm-btn" onClick={() => removeKV(list, setList, item.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

function AuthConfig({ authType, setAuthType, bearerToken, setBearerToken, basicUser, setBasicUser, basicPass, setBasicPass, apiKey, setApiKey, apiKeyHeader, setApiKeyHeader }: {
  authType: AuthType; setAuthType: (v: AuthType) => void;
  bearerToken: string; setBearerToken: (v: string) => void;
  basicUser: string; setBasicUser: (v: string) => void;
  basicPass: string; setBasicPass: (v: string) => void;
  apiKey: string; setApiKey: (v: string) => void;
  apiKeyHeader: string; setApiKeyHeader: (v: string) => void;
}) {
  return (
    <div>
      <div className="section-label">Auth Type</div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['none', 'bearer', 'basic', 'apikey'] as AuthType[]).map(t => (
          <button key={t} onClick={() => setAuthType(t)} style={{
            background: authType === t ? 'var(--accent-dim)' : 'var(--bg-elevated)',
            border: `1px solid ${authType === t ? 'var(--accent)' : 'var(--border)'}`,
            color: authType === t ? 'var(--accent)' : 'var(--text-secondary)',
            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>{t === 'apikey' ? 'API Key' : t === 'none' ? 'None' : t === 'bearer' ? 'Bearer Token' : 'Basic Auth'}</button>
        ))}
      </div>
      {authType === 'bearer' && (
        <div>
          <div className="section-label">Token</div>
          <input className="auth-input" value={bearerToken} onChange={e => setBearerToken(e.target.value)} placeholder="eyJhbGci..." type="password" />
        </div>
      )}
      {authType === 'basic' && (
        <div>
          <div className="section-label">Username</div>
          <input className="auth-input" value={basicUser} onChange={e => setBasicUser(e.target.value)} placeholder="username" />
          <div className="section-label">Password</div>
          <input className="auth-input" value={basicPass} onChange={e => setBasicPass(e.target.value)} placeholder="password" type="password" />
        </div>
      )}
      {authType === 'apikey' && (
        <div>
          <div className="section-label">Header Name</div>
          <input className="auth-input" value={apiKeyHeader} onChange={e => setApiKeyHeader(e.target.value)} placeholder="X-API-Key" />
          <div className="section-label">Key Value</div>
          <input className="auth-input" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="your-api-key" type="password" />
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', padding: '4px 0' }}>
      <span style={{ color: 'var(--text-muted)', minWidth: '100px', fontSize: '12px' }}>{label}</span>
      <span style={{ color: color || 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : undefined, fontSize: '12px', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
