import { Copy, Download, Loader2 } from 'lucide-react';
import { syntaxHighlight, isJsonString } from '@/lib/jsonHighlight';
import { statusColor } from '@/lib/apiTesterUtils';
import type { ApiTesterState } from '@/hooks/useApiTester';
import type { ResponseTab } from '@/components/api-tester/types';
import InfoRow from '@/components/api-tester/InfoRow';

interface ResponsePanelProps {
    state: ApiTesterState;
}

export default function ResponsePanel({ state }: ResponsePanelProps) {
    const {
        respTab,
        setRespTab,
        response,
        loading,
        error,
        responsePretty,
        setResponsePretty,
        responseCopyState,
        built,
        useProxy,
        copyResponseBody,
        downloadResponseBody,
    } = state;

    return (
        <div className="panel-column">
            <div className="tab-row tab-row-response">
                {(['body', 'headers', 'info'] as ResponseTab[]).map((t) => (
                    <button key={t} type="button" className={`tab-btn ${respTab === t ? 'active' : ''}`} onClick={() => setRespTab(t)}>
                        {t === 'body' ? 'Body' : t === 'headers' ? 'Headers' : 'Info'}
                    </button>
                ))}
                {response && (
                    <div className="response-actions">
                        {respTab === 'body' && isJsonString(response.body) && (
                            <button
                                type="button"
                                className={`tool-btn ${responsePretty ? 'accent' : ''}`}
                                onClick={() => setResponsePretty((current) => !current)}
                            >
                                {responsePretty ? 'Pretty' : 'Raw'}
                            </button>
                        )}
                        <button type="button" className="tool-btn" onClick={copyResponseBody}>
                            <Copy size={14} aria-hidden />
                            {responseCopyState === 'ok' ? 'Copied' : responseCopyState === 'error' ? 'Copy failed' : 'Copy body'}
                        </button>
                        <button type="button" className="tool-btn" onClick={downloadResponseBody}>
                            <Download size={14} aria-hidden />
                            Download
                        </button>
                    </div>
                )}
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
                            Common causes: CORS policy, network error, invalid URL. Enable the proxy for cross-origin APIs, or try the local
                            echo preset.
                        </p>
                    </div>
                )}
                {response && !loading && (
                    <>
                        {respTab === 'body' &&
                            (isJsonString(response.body) ? (
                                responsePretty ? (
                                    <pre
                                        className="json-output response-pre"
                                        dangerouslySetInnerHTML={{ __html: syntaxHighlight(response.body, { prettify: true }) }}
                                    />
                                ) : (
                                    <pre className="response-pre plain-pre">{response.body}</pre>
                                )
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
                {!response && !loading && !error && <div className="placeholder-mono">Send a request to see the response</div>}
            </div>
        </div>
    );
}
