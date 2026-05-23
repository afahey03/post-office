'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, Loader2, Send, X } from 'lucide-react';
import {
    buildRequestHeaders,
    resolveAbsoluteBase,
    resolveRequestUrl,
    type HttpMethod,
    type AuthType,
    type BodyContentType,
} from '@/lib/apiRequest';
import { buildUrlWithParams } from '@/lib/buildUrl';
import { syntaxHighlight, isJsonString } from '@/lib/jsonHighlight';
import { loadApiState, saveApiState, type PersistedApiState } from '@/lib/apiStorage';

type TabKey = 'params' | 'headers' | 'body' | 'auth';
type ResponseTab = 'body' | 'headers' | 'info';

interface KeyValue {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
    size: string;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: '#3dd68c',
    POST: '#6e6af0',
    PUT: '#f0a940',
    PATCH: '#f3ef06',
    DELETE: '#f06464',
    HEAD: '#89ddff',
    OPTIONS: '#c792ea',
};

function uid() {
    return Math.random().toString(36).slice(2, 8);
}

function emptyKV(): KeyValue {
    return { id: uid(), key: '', value: '', enabled: true };
}

function kvToRows(list: KeyValue[]) {
    return list.map(({ key, value, enabled }) => ({ key, value, enabled }));
}

function rowsToKV(rows: { key: string; value: string; enabled: boolean }[]): KeyValue[] {
    const items = rows.map((r) => ({ id: uid(), ...r }));
    if (!items.some((i) => !i.key)) items.push(emptyKV());
    return items.length ? items : [emptyKV()];
}

function statusColor(code: number): string {
    if (code < 300) return 'var(--success)';
    if (code < 400) return 'var(--warning)';
    return 'var(--error)';
}

function formatSize(text: string): string {
    const bytes = new TextEncoder().encode(text).length;
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

const PRESETS = [
    { label: 'Local echo', method: 'GET' as HttpMethod, url: '/api/echo', relative: true },
    { label: 'JSONPlaceholder post', method: 'GET' as HttpMethod, url: 'https://jsonplaceholder.typicode.com/posts/1' },
    { label: 'JokeAPI', method: 'GET' as HttpMethod, url: 'https://v2.jokeapi.dev/joke/Programming' }
];

function readInitialSaved(): Partial<PersistedApiState> | null {
    return loadApiState();
}

export default function ApiTester() {
    const abortRef = useRef<AbortController | null>(null);
    const saved = readInitialSaved();

    const [method, setMethod] = useState<HttpMethod>(() => (saved?.method as HttpMethod) || 'GET');
    const [url, setUrl] = useState(() => saved?.url || '');
    const [useProxy, setUseProxy] = useState(() => saved?.useProxy ?? false);
    const [tab, setTab] = useState<TabKey>('params');
    const [respTab, setRespTab] = useState<ResponseTab>('body');
    const [params, setParams] = useState<KeyValue[]>(() => (saved?.params ? rowsToKV(saved.params) : [emptyKV()]));
    const [headers, setHeaders] = useState<KeyValue[]>(() => (saved?.headers ? rowsToKV(saved.headers) : [emptyKV()]));
    const [body, setBody] = useState(() => saved?.body ?? '');
    const [bodyContentType, setBodyContentType] = useState<BodyContentType>(
        () => (saved?.bodyContentType as BodyContentType) || 'application/json',
    );
    const [authType, setAuthType] = useState<AuthType>(() => (saved?.authType as AuthType) || 'none');
    const [bearerToken, setBearerToken] = useState('');
    const [basicUser, setBasicUser] = useState('');
    const [basicPass, setBasicPass] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiKeyHeader, setApiKeyHeader] = useState(() => saved?.apiKeyHeader || 'X-API-Key');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        saveApiState({
            method,
            url,
            params: kvToRows(params),
            headers: kvToRows(headers),
            body,
            bodyContentType,
            authType,
            apiKeyHeader,
            useProxy,
        });
    }, [method, url, params, headers, body, bodyContentType, authType, apiKeyHeader, useProxy]);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const targetUrl = useCallback(() => {
        return buildUrlWithParams(resolveAbsoluteBase(url, origin), kvToRows(params));
    }, [url, params, origin]);

    const cancel = () => {
        abortRef.current?.abort();
        abortRef.current = null;
        setLoading(false);
    };


    const send = async () => {
        const finalTarget = targetUrl();
        if (!finalTarget) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError('');
        setResponse(null);
        const start = performance.now();

        const hasBody = !['GET', 'HEAD'].includes(method) && body.length > 0;
        const contentType = hasBody ? bodyContentType : 'none';
        const reqHeaders = buildRequestHeaders(
            kvToRows(headers),
            { type: authType, bearerToken, basicUser, basicPass, apiKey, apiKeyHeader },
            contentType,
            hasBody,
        );

        const { fetchUrl, targetUrl: resolvedTarget } = resolveRequestUrl(url, kvToRows(params), useProxy, origin);

        try {
            let res: Response;
            if (useProxy) {
                res = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: resolvedTarget,
                        method,
                        headers: reqHeaders,
                        body: hasBody ? body : undefined,
                    }),
                    signal: controller.signal,
                });
                const proxyPayload = await res.json();
                if (!res.ok) {
                    throw new Error(proxyPayload.error || `Proxy error (${res.status})`);
                }
                const elapsed = Math.round(performance.now() - start);
                setResponse({
                    status: proxyPayload.status,
                    statusText: proxyPayload.statusText,
                    headers: proxyPayload.headers,
                    body: proxyPayload.body,
                    time: elapsed,
                    size: formatSize(proxyPayload.body),
                });
            } else {
                const directUrl = targetUrl();
                const opts: RequestInit = { method, headers: reqHeaders, signal: controller.signal };
                if (hasBody) opts.body = body;
                res = await fetch(directUrl, opts);
                const elapsed = Math.round(performance.now() - start);
                const text = await res.text();
                const resHeaders: Record<string, string> = {};
                res.headers.forEach((v, k) => {
                    resHeaders[k] = v;
                });
                setResponse({
                    status: res.status,
                    statusText: res.statusText,
                    headers: resHeaders,
                    body: text,
                    time: elapsed,
                    size: formatSize(text),
                });
            }
            setRespTab('body');
        } catch (e) {
            if ((e as Error).name === 'AbortError') return;
            setError((e as Error).message);
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
                setLoading(false);
            }
        }
    };

    const updateKV = (
        list: KeyValue[],
        setList: (l: KeyValue[]) => void,
        id: string,
        field: keyof KeyValue,
        val: string | boolean,
    ) => {
        const updated = list.map((item) => (item.id === id ? { ...item, [field]: val } : item));
        if (field === 'key' && val !== '' && !updated.some((i) => i.key === '' && i.id !== id)) {
            updated.push(emptyKV());
        }
        setList(updated);
    };

    const removeKV = (list: KeyValue[], setList: (l: KeyValue[]) => void, id: string) => {
        const filtered = list.filter((i) => i.id !== id);
        if (!filtered.length) filtered.push(emptyKV());
        setList(filtered);
    };

    const loadPreset = (p: (typeof PRESETS)[0]) => {
        setMethod(p.method);
        setUrl(p.url);
        setParams([emptyKV()]);
        if (p.relative && typeof window !== 'undefined') {
            setUseProxy(false);
        }
    };

    const activeCount = (list: KeyValue[]) => list.filter((i) => i.enabled && i.key).length;
    const built = targetUrl();
    const displayUrl = url.trim();
    const methodSkipsBody = ['GET', 'HEAD'].includes(method);

    return (
        <div className="tool-shell tool-shell-flex">
            <div className="api-bar">
                <label className="proxy-toggle">
                    <input type="checkbox" checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} />
                    Use server proxy (bypasses CORS, blocks localhost/private IPs)
                </label>
                <div className="preset-row">
                    {PRESETS.map((p) => (
                        <button key={p.label} type="button" className="preset-btn" onClick={() => loadPreset(p)}>
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="url-row">
                    <label className="visually-hidden" htmlFor="http-method">
                        HTTP method
                    </label>
                    <div className="method-select-wrap" style={{ color: METHOD_COLORS[method] }}>
                        <select
                            id="http-method"
                            className="method-select"
                            value={method}
                            onChange={(e) => setMethod(e.target.value as HttpMethod)}
                            style={{ color: METHOD_COLORS[method] }}
                        >
                            {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as HttpMethod[]).map((m) => (
                                <option key={m} value={m} style={{ color: METHOD_COLORS[m] }}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="method-chevron" aria-hidden />
                    </div>
                    <input
                        className="api-input url-input-flex"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
                        placeholder="https://..."
                        aria-label="Request URL"
                    />
                    <div className="url-row-actions">
                        {loading && (
                            <button type="button" className="cancel-btn cancel-btn-pill" onClick={cancel} aria-label="Cancel request">
                                <X size={16} aria-hidden />
                                Cancel
                            </button>
                        )}
                        <button
                            type="button"
                            className={`send-btn ${loading ? 'send-btn-full' : 'send-btn-rounded'}`}
                            onClick={send}
                            disabled={loading || !displayUrl}
                            aria-busy={loading}
                        >
                            {loading ? (
                                <Loader2 size={16} className="spin-icon" aria-hidden />
                            ) : (
                                <Send size={16} aria-hidden />
                            )}
                            Send
                        </button>
                    </div>
                </div>
                {built !== displayUrl && displayUrl && <div className="url-preview">→ {built}</div>}
            </div>

            <div className="split-2-tight split-fill">
                <div className="request-pane panel-column">
                    <div className="tab-row">
                        {(['params', 'headers', 'body', 'auth'] as TabKey[]).map((t) => (
                            <button key={t} type="button" className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                                {t === 'params' ? 'Params' : t === 'headers' ? 'Headers' : t === 'body' ? 'Body' : 'Auth'}
                                {t === 'params' && activeCount(params) > 0 && <span className="tab-badge">{activeCount(params)}</span>}
                                {t === 'headers' && activeCount(headers) > 0 && <span className="tab-badge">{activeCount(headers)}</span>}
                                {t === 'auth' && authType !== 'none' && <span className="tab-badge">✓</span>}
                            </button>
                        ))}
                    </div>
                    <div className="tab-panel">
                        {(tab === 'params' || tab === 'headers') && (
                            <KVEditor
                                list={tab === 'params' ? params : headers}
                                setList={tab === 'params' ? setParams : setHeaders}
                                updateKV={updateKV}
                                removeKV={removeKV}
                                keyPlaceholder={tab === 'params' ? 'parameter' : 'Header-Name'}
                                valPlaceholder="value"
                            />
                        )}
                        {tab === 'body' && (
                            <div className="body-tab">
                                <div className="body-ct-row">
                                    <label className="panel-label" htmlFor="body-content-type">Content-Type</label>
                                    <select
                                        id="body-content-type"
                                        className="tool-select"
                                        value={bodyContentType}
                                        onChange={(e) => setBodyContentType(e.target.value as BodyContentType)}
                                    >
                                        <option value="application/json">application/json</option>
                                        <option value="text/plain">text/plain</option>
                                        <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                                        <option value="none">none</option>
                                    </select>
                                    {methodSkipsBody && <span className="body-skip-hint">Ignored for {method}</span>}
                                </div>
                                <textarea
                                    className="body-input"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder={bodyContentType === 'application/json' ? '{\n  "key": "value"\n}' : ''}
                                    spellCheck={false}
                                    aria-label="Request body"
                                />
                            </div>
                        )}
                        {tab === 'auth' && (
                            <AuthConfig
                                authType={authType}
                                setAuthType={setAuthType}
                                bearerToken={bearerToken}
                                setBearerToken={setBearerToken}
                                basicUser={basicUser}
                                setBasicUser={setBasicUser}
                                basicPass={basicPass}
                                setBasicPass={setBasicPass}
                                apiKey={apiKey}
                                setApiKey={setApiKey}
                                apiKeyHeader={apiKeyHeader}
                                setApiKeyHeader={setApiKeyHeader}
                            />
                        )}
                    </div>
                </div>

                <div className="panel-column">
                    <div className="tab-row tab-row-response">
                        {(['body', 'headers', 'info'] as ResponseTab[]).map((t) => (
                            <button key={t} type="button" className={`tab-btn ${respTab === t ? 'active' : ''}`} onClick={() => setRespTab(t)}>
                                {t === 'body' ? 'Body' : t === 'headers' ? 'Headers' : 'Info'}
                            </button>
                        ))}
                        {response && (
                            <div className="response-meta">
                                <span className="response-status" style={{ color: statusColor(response.status) }}>
                                    {response.status} {response.statusText}
                                </span>
                                <span className="stats-hint">{response.time}ms</span>
                                <span className="stats-hint">{response.size}</span>
                            </div>
                        )}
                    </div>

                    <div className="tab-panel" aria-live="polite">
                        {loading && (
                            <div className="loading-row">
                                <Loader2 size={16} className="spin-icon" aria-hidden />
                                Sending request...
                            </div>
                        )}
                        {error && !loading && (
                            <div>
                                <div className="error-title">Request Failed</div>
                                <div className="error-body">{error}</div>
                                <p className="error-hint">
                                    Common causes: CORS policy, network error, invalid URL. Enable the proxy for cross-origin APIs, or try
                                    the local echo preset.
                                </p>
                            </div>
                        )}
                        {response && !loading && (
                            <>
                                {respTab === 'body' &&
                                    (isJsonString(response.body) ? (
                                        <pre
                                            className="json-output response-pre"
                                            dangerouslySetInnerHTML={{ __html: syntaxHighlight(response.body, { prettify: true }) }}
                                        />
                                    ) : (
                                        <pre className="response-pre plain-pre">{response.body}</pre>
                                    ))}
                                {respTab === 'headers' && (
                                    <div>
                                        {Object.entries(response.headers).map(([k, v]) => (
                                            <div key={k} className="header-row">
                                                <span className="header-key">{k}</span>
                                                <span className="header-val">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {respTab === 'info' && (
                                    <div className="info-panel">
                                        <InfoRow label="Status" value={`${response.status} ${response.statusText}`} color={statusColor(response.status)} />
                                        <InfoRow label="Time" value={`${response.time}ms`} />
                                        <InfoRow label="Size" value={response.size} />
                                        <InfoRow label="Content-Type" value={response.headers['content-type'] || '—'} />
                                        <InfoRow label="URL" value={built} mono />
                                        <InfoRow label="Proxy" value={useProxy ? 'enabled' : 'disabled'} />
                                    </div>
                                )}
                            </>
                        )}
                        {!response && !loading && !error && (
                            <div className="placeholder-mono">Send a request to see the response</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KVEditor({
    list,
    setList,
    updateKV,
    removeKV,
    keyPlaceholder,
    valPlaceholder,
}: {
    list: KeyValue[];
    setList: (l: KeyValue[]) => void;
    updateKV: (
        list: KeyValue[],
        setList: (l: KeyValue[]) => void,
        id: string,
        field: keyof KeyValue,
        val: string | boolean,
    ) => void;
    removeKV: (list: KeyValue[], setList: (l: KeyValue[]) => void, id: string) => void;
    keyPlaceholder: string;
    valPlaceholder: string;
}) {
    return (
        <div>
            <div className="kv-header-row">
                <span />
                <span className="kv-col-label">Key</span>
                <span className="kv-col-label">Value</span>
                <span />
            </div>
            {list.map((item) => (
                <div key={item.id} className="kv-row">
                    <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => updateKV(list, setList, item.id, 'enabled', e.target.checked)}
                        aria-label={`Enable ${item.key || 'row'}`}
                    />
                    <input
                        className="kv-input"
                        value={item.key}
                        onChange={(e) => updateKV(list, setList, item.id, 'key', e.target.value)}
                        placeholder={keyPlaceholder}
                    />
                    <input
                        className="kv-input"
                        value={item.value}
                        onChange={(e) => updateKV(list, setList, item.id, 'value', e.target.value)}
                        placeholder={valPlaceholder}
                    />
                    <button type="button" className="rm-btn" onClick={() => removeKV(list, setList, item.id)} aria-label="Remove row">
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

function AuthConfig({
    authType,
    setAuthType,
    bearerToken,
    setBearerToken,
    basicUser,
    setBasicUser,
    basicPass,
    setBasicPass,
    apiKey,
    setApiKey,
    apiKeyHeader,
    setApiKeyHeader,
}: {
    authType: AuthType;
    setAuthType: (v: AuthType) => void;
    bearerToken: string;
    setBearerToken: (v: string) => void;
    basicUser: string;
    setBasicUser: (v: string) => void;
    basicPass: string;
    setBasicPass: (v: string) => void;
    apiKey: string;
    setApiKey: (v: string) => void;
    apiKeyHeader: string;
    setApiKeyHeader: (v: string) => void;
}) {
    return (
        <div>
            <p className="auth-hint">Credentials are kept in memory only - never saved to local storage.</p>
            <div className="section-label">Auth Type</div>
            <div className="auth-type-row">
                {(['none', 'bearer', 'basic', 'apikey'] as AuthType[]).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setAuthType(t)}
                        className={`tool-btn ${authType === t ? 'accent' : ''}`}
                    >
                        {t === 'apikey' ? 'API Key' : t === 'none' ? 'None' : t === 'bearer' ? 'Bearer Token' : 'Basic Auth'}
                    </button>
                ))}
            </div>
            {authType === 'bearer' && (
                <div>
                    <div className="section-label">Token</div>
                    <input
                        className="auth-input"
                        value={bearerToken}
                        onChange={(e) => setBearerToken(e.target.value)}
                        placeholder="eyJhbGci..."
                        type="password"
                        autoComplete="off"
                    />
                </div>
            )}
            {authType === 'basic' && (
                <div>
                    <div className="section-label">Username</div>
                    <input className="auth-input" value={basicUser} onChange={(e) => setBasicUser(e.target.value)} placeholder="username" />
                    <div className="section-label">Password</div>
                    <input
                        className="auth-input"
                        value={basicPass}
                        onChange={(e) => setBasicPass(e.target.value)}
                        placeholder="password"
                        type="password"
                        autoComplete="off"
                    />
                </div>
            )}
            {authType === 'apikey' && (
                <div>
                    <div className="section-label">Header Name</div>
                    <input className="auth-input" value={apiKeyHeader} onChange={(e) => setApiKeyHeader(e.target.value)} placeholder="X-API-Key" />
                    <div className="section-label">Key Value</div>
                    <input
                        className="auth-input"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="your-api-key"
                        type="password"
                        autoComplete="off"
                    />
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
    return (
        <div className="info-row">
            <span className="info-label">{label}</span>
            <span className="info-value" style={{ color: color || 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>
                {value}
            </span>
        </div>
    );
}
