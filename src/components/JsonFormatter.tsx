'use client';

import { useState, useCallback } from 'react';

type Status = 'idle' | 'valid' | 'error';

function formatJson(raw: string, indent: number): { result: string; status: Status; error?: string; stats?: { keys: number; depth: number; size: string } } {
  const trimmed = raw.trim();
  if (!trimmed) return { result: '', status: 'idle' };
  try {
    const parsed = JSON.parse(trimmed);
    const formatted = JSON.stringify(parsed, null, indent);
    const stats = analyzeJson(parsed);
    return { result: formatted, status: 'valid', stats };
  } catch (e) {
    return { result: raw, status: 'error', error: (e as Error).message };
  }
}

function analyzeJson(obj: unknown): { keys: number; depth: number; size: string } {
  let keyCount = 0;
  let maxDepth = 0;
  function traverse(o: unknown, d: number) {
    maxDepth = Math.max(maxDepth, d);
    if (Array.isArray(o)) { o.forEach(i => traverse(i, d + 1)); }
    else if (o && typeof o === 'object') {
      const keys = Object.keys(o as object);
      keyCount += keys.length;
      keys.forEach(k => traverse((o as Record<string, unknown>)[k], d + 1));
    }
  }
  traverse(obj, 0);
  const bytes = JSON.stringify(obj).length;
  const size = bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`;
  return { keys: keyCount, depth: maxDepth, size };
}

function syntaxHighlight(json: string): string {
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

const EXAMPLES = {
  user: '{"id":1,"name":"Alice Chen","email":"alice@example.com","role":"admin","createdAt":"2024-01-15T10:30:00Z","preferences":{"theme":"dark","notifications":true,"language":"en"},"tags":["developer","beta-tester"]}',
  error: '{"status":"error","code":422,"message":"Validation failed","errors":[{"field":"email","message":"Invalid format"},{"field":"age","message":"Must be 18+"}],"timestamp":"2024-01-15T10:30:00Z"}',
  nested: '{"api":{"version":"v2","endpoints":{"users":{"get":"/users","post":"/users","put":"/users/:id"},"auth":{"login":"/auth/login","refresh":"/auth/refresh"}}},"meta":{"rateLimit":1000,"timeout":30}}',
};

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState(2);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ keys: number; depth: number; size: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const process = useCallback((raw: string, ind: number) => {
    const res = formatJson(raw, ind);
    setOutput(res.result);
    setStatus(res.status);
    setError(res.error || '');
    setStats(res.stats || null);
  }, []);

  const handleInput = (val: string) => {
    setInput(val);
    process(val, indent);
  };

  const handleIndent = (val: number) => {
    setIndent(val);
    process(input, val);
  };

  const handleExample = (key: keyof typeof EXAMPLES) => {
    const val = EXAMPLES[key];
    setInput(val);
    process(val, indent);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const minify = () => {
    try {
      const min = JSON.stringify(JSON.parse(input));
      setOutput(min);
      setInput(min);
    } catch {}
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setStatus('idle');
    setError('');
    setStats(null);
  };

  const statusColor = status === 'valid' ? 'var(--success)' : status === 'error' ? 'var(--error)' : 'var(--text-muted)';
  const statusBg = status === 'valid' ? 'var(--success-dim)' : status === 'error' ? 'var(--error-dim)' : 'transparent';

  return (
    <div style={{ padding: '24px', height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{`
        .json-key { color: #c792ea; }
        .json-string { color: #c3e88d; }
        .json-number { color: #f78c6c; }
        .json-bool { color: #89ddff; }
        .json-null { color: #546e7a; }
        .json-output { font-family: var(--font-mono); font-size: 13px; line-height: 1.7; white-space: pre; overflow: auto; flex: 1; }
        .tool-btn { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-secondary); padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .tool-btn:hover { border-color: var(--border-bright); color: var(--text-primary); }
        .tool-btn.accent { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
        .tool-btn.accent:hover { background: var(--accent); color: white; }
        textarea { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-family: var(--font-mono); font-size: 13px; padding: 16px; border-radius: 8px; resize: none; width: 100%; height: 100%; outline: none; line-height: 1.7; }
        textarea:focus { border-color: var(--border-bright); }
        textarea::placeholder { color: var(--text-muted, #444466); }
        .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .panel-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); }
        select { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); padding: 4px 8px; border-radius: 6px; font-size: 12px; outline: none; font-family: inherit; cursor: pointer; }
      `}</style>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '4px' }}>Examples:</span>
        {(Object.keys(EXAMPLES) as Array<keyof typeof EXAMPLES>).map(k => (
          <button key={k} className="tool-btn" onClick={() => handleExample(k)}>{k}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Indent:</span>
          <select value={indent} onChange={e => handleIndent(Number(e.target.value))}>
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={1}>1 space</option>
          </select>
          <button className="tool-btn" onClick={minify}>Minify</button>
          <button className="tool-btn" onClick={clear}>Clear</button>
        </div>
      </div>

      {/* Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="panel-header">
            <span className="panel-label">Input</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paste JSON here</span>
          </div>
          <textarea
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder={`{\n  "paste": "your json here"\n}`}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="panel-label">Output</span>
              {status !== 'idle' && (
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                  color: statusColor, background: statusBg, border: `1px solid ${statusColor}40`
                }}>
                  {status === 'valid' ? '✓ valid' : '✗ invalid'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {stats && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {stats.keys} keys · depth {stats.depth} · {stats.size}
                </span>
              )}
              <button className={`tool-btn ${status === 'valid' ? 'accent' : ''}`} onClick={copy} disabled={!output}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${status === 'error' ? 'var(--error)' : status === 'valid' ? 'var(--border)' : 'var(--border)'}`,
            borderRadius: '8px',
            padding: '16px',
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
          }}>
            {status === 'error' ? (
              <div>
                <div style={{ color: 'var(--error)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Parse Error</div>
                <div style={{ color: 'var(--error)', fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: 0.8 }}>{error}</div>
              </div>
            ) : output ? (
              <pre className="json-output" dangerouslySetInnerHTML={{ __html: syntaxHighlight(output) }} />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                Formatted output will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
