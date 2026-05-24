'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Copy, Check, Eraser, Minimize2 } from 'lucide-react';
import JsonCodeEditor from '@/components/JsonCodeEditor';
import { analyzeJson, formatJson, sortJsonKeys, stripEmptyJson, type FormatStatus } from '@/lib/formatJson';
import { syntaxHighlight } from '@/lib/jsonHighlight';
import { copyToClipboard } from '@/lib/copyToClipboard';

const EXAMPLES: { label: string; key: string; value: string }[] = [
    { label: 'User', key: 'user', value: '{"id":1,"name":"Alice Chen","email":"alice@example.com","role":"admin","createdAt":"2024-01-15T10:30:00Z","preferences":{"theme":"dark","notifications":true,"language":"en"},"tags":["developer","beta-tester"]}' },
    { label: 'Error', key: 'error', value: '{"status":"error","code":422,"message":"Validation failed","errors":[{"field":"email","message":"Invalid format"},{"field":"age","message":"Must be 18+"}],"timestamp":"2024-01-15T10:30:00Z"}' },
    { label: 'Nested', key: 'nested', value: '{"api":{"version":"v2","endpoints":{"users":{"get":"/users","post":"/users","put":"/users/:id"},"auth":{"login":"/auth/login","refresh":"/auth/refresh"}}},"meta":{"rateLimit":1000,"timeout":30}}' },
];

const DEBOUNCE_MS = 200;
const FORMAT_TRACK_COOLDOWN_MS = 15_000;

export default function JsonFormatter() {
    const lastTrackedSignature = useRef('');
    const lastTrackedAt = useRef(0);
    const [input, setInput] = useState('');
    const [indent, setIndent] = useState(2);
    const [compactOutput, setCompactOutput] = useState(false);
    const [sortKeys, setSortKeys] = useState(false);
    const [stripEmpty, setStripEmpty] = useState(false);
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState<FormatStatus>('idle');
    const [error, setError] = useState('');
    const [stats, setStats] = useState<{ keys: number; depth: number; size: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState(false);

    const trackSuccessfulFormat = useCallback(async (raw: string, formatted: string) => {
        const signature = `${raw.length}:${formatted.length}:${raw.slice(0, 64)}`;
        const now = Date.now();

        if (signature === lastTrackedSignature.current && now - lastTrackedAt.current < FORMAT_TRACK_COOLDOWN_MS) {
            return;
        }

        lastTrackedSignature.current = signature;
        lastTrackedAt.current = now;

        try {
            await fetch('/api/track/json-format', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: 'json-formatter' }),
            });
        } catch {
            // Tracking is best-effort only.
        }
    }, []);

    const process = useCallback((raw: string, ind: number, compact: boolean, sort: boolean, strip: boolean) => {
        const res = formatJson(raw, ind);
        if (res.status === 'valid') {
            const parsed = JSON.parse(raw);
            const transformed = strip ? stripEmptyJson(parsed) : parsed;
            const normalized = sort ? sortJsonKeys(transformed) : transformed;
            const nextOutput = compact ? JSON.stringify(normalized) : JSON.stringify(normalized, null, ind);
            setOutput(nextOutput);
            setStats(analyzeJson(normalized));
            void trackSuccessfulFormat(raw, nextOutput);
        } else {
            setOutput(res.result);
            setStats(res.stats || null);
        }
        setStatus(res.status);
        setError(res.error || '');
    }, [trackSuccessfulFormat]);

    useEffect(() => {
        const timer = window.setTimeout(() => process(input, indent, compactOutput, sortKeys, stripEmpty), DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [input, indent, compactOutput, sortKeys, stripEmpty, process]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey) || !event.shiftKey) return;
            if (event.key.toLowerCase() === 'm') {
                event.preventDefault();
                try {
                    JSON.parse(input);
                    setCompactOutput((current) => !current);
                } catch {
                    /* invalid json */
                }
            }
            if (event.key.toLowerCase() === 'c' && output) {
                event.preventDefault();
                void (async () => {
                    const ok = await copyToClipboard(output);
                    setCopyError(!ok);
                    if (ok) {
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1500);
                    }
                })();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [input, output]);

    const handleIndent = (val: number) => {
        setIndent(val);
        setCompactOutput(false);
    };

    const handleExample = (value: string) => {
        setInput(value);
        setCompactOutput(false);
    };

    const copy = async () => {
        const ok = await copyToClipboard(output);
        setCopyError(!ok);
        if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        }
    };

    const minify = () => {
        try {
            JSON.parse(input);
            setCompactOutput((current) => !current);
        } catch {
            /* invalid json */
        }
    };

    const clear = () => {
        setInput('');
        setCompactOutput(false);
        setSortKeys(false);
        setStripEmpty(false);
        setOutput('');
        setStatus('idle');
        setError('');
        setStats(null);
        setCopyError(false);
    };

    const statusColor = status === 'valid' ? 'var(--success)' : status === 'error' ? 'var(--error)' : 'var(--text-muted)';
    const statusBg = status === 'valid' ? 'var(--success-dim)' : status === 'error' ? 'var(--error-dim)' : 'transparent';

    return (
        <div className="tool-shell tool-shell-padded">
            <div className="toolbar-row">
                <span className="toolbar-label">Examples:</span>
                {EXAMPLES.map((ex) => (
                    <button key={ex.key} type="button" className="tool-btn" onClick={() => handleExample(ex.value)}>
                        {ex.label}
                    </button>
                ))}
                <div className="toolbar-actions">
                    <label className="toolbar-label" htmlFor="json-indent">
                        Indent:
                    </label>
                    <select id="json-indent" className="tool-select" value={indent} onChange={(e) => handleIndent(Number(e.target.value))}>
                        <option value={2}>2 spaces</option>
                        <option value={4}>4 spaces</option>
                        <option value={1}>1 space</option>
                    </select>
                    <button
                        type="button"
                        className={`tool-btn ${sortKeys ? 'accent' : ''}`}
                        onClick={() => setSortKeys((current) => !current)}
                        disabled={status === 'error'}
                        aria-pressed={sortKeys}
                    >
                        Sort keys
                    </button>
                    <button
                        type="button"
                        className={`tool-btn ${stripEmpty ? 'accent' : ''}`}
                        onClick={() => setStripEmpty((current) => !current)}
                        disabled={status === 'error'}
                        aria-pressed={stripEmpty}
                    >
                        Strip empty
                    </button>
                    <button
                        type="button"
                        className={`tool-btn ${compactOutput && status === 'valid' ? 'accent' : ''}`}
                        onClick={minify}
                        aria-label="Minify JSON"
                        aria-pressed={compactOutput && status === 'valid'}
                        disabled={status !== 'valid'}
                    >
                        <Minimize2 size={14} aria-hidden />
                        {compactOutput && status === 'valid' ? 'Minified' : 'Minify'}
                    </button>
                    <button type="button" className="tool-btn" onClick={clear} aria-label="Clear JSON">
                        <Eraser size={14} aria-hidden />
                        Clear
                    </button>
                    <button
                        type="button"
                        className={`tool-btn ${status === 'valid' ? 'accent' : ''}`}
                        onClick={copy}
                        disabled={!output}
                        aria-label="Copy formatted JSON"
                    >
                        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>

            <div className="split-2 split-fill">
                <div className="panel-column">
                    <div className="panel-header">
                        <div className="panel-header-start">
                            <span className="panel-label">Input</span>
                        </div>
                    </div>
                    <JsonCodeEditor
                        value={input}
                        onChange={setInput}
                        placeholder={'{\n  "paste": "your json here"\n}'}
                        aria-label="JSON input"
                    />
                </div>

                <div className="panel-column">
                    <div className="panel-header">
                        <div className="panel-header-start">
                            <span className="panel-label">Output</span>
                            {status !== 'idle' && (
                                <span
                                    className="status-pill"
                                    style={{
                                        color: statusColor,
                                        background: statusBg,
                                        border: `1px solid ${statusColor}40`,
                                    }}
                                >
                                    {status === 'valid' ? '✓ valid' : '✗ invalid'}
                                </span>
                            )}
                        </div>
                        <div className="panel-header-end">
                            {stats && (
                                <span className="stats-hint" title="Key count includes object properties only, not array indices">
                                    {stats.keys} keys · depth {stats.depth} · {stats.size}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`output-panel ${status === 'error' ? 'error' : ''}`}>
                        {status === 'error' ? (
                            <div>
                                <div className="error-title">Parse Error</div>
                                <div className="error-body">{error}</div>
                            </div>
                        ) : output ? (
                            <pre className="json-output" dangerouslySetInnerHTML={{ __html: syntaxHighlight(output) }} />
                        ) : (
                            <div className="placeholder-mono">Formatted output will appear here</div>
                        )}
                        {copyError && <div className="error-body" style={{ marginTop: 8 }}>Copy failed — check browser permissions.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
