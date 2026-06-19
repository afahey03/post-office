import { ChevronDown, Copy, History, Loader2, Save, Send, Upload, X, DownloadCloud, UploadCloud, Settings2 } from 'lucide-react';
import type { HttpMethod } from '@/lib/apiRequest';
import { METHOD_COLORS, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS, PRESETS, clampTimeoutMs } from '@/lib/apiTesterUtils';
import type { ApiTesterState } from '@/hooks/useApiTester';
import EnvironmentPanel from '@/components/api-tester/EnvironmentPanel';

interface ApiToolbarProps {
    state: ApiTesterState;
}

export default function ApiToolbar({ state }: ApiToolbarProps) {
    const {
        method,
        setMethod,
        url,
        setUrl,
        useProxy,
        setUseProxy,
        timeoutMs,
        setTimeoutMs,
        curlInput,
        setCurlInput,
        collectionName,
        setCollectionName,
        collections,
        selectedCollectionId,
        setSelectedCollectionId,
        history,
        loading,
        built,
        displayUrl,
        curlCopyState,
        environments,
        setEnvironments,
        activeEnvironmentId,
        setActiveEnvironmentId,
        activeEnvironment,
        showEnvEditor,
        setShowEnvEditor,
        importInputRef,
        cancel,
        send,
        applySnapshot,
        importCurl,
        copyCurl,
        saveCurrentCollection,
        removeSelectedCollection,
        clearAllCollections,
        exportCollections,
        importCollections,
        loadPreset,
        clearHistory,
    } = state;

    return (
        <div className="api-bar">
            <label className="proxy-toggle">
                <input type="checkbox" checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} />
                Use server proxy (bypasses CORS, blocks localhost/private IPs)
            </label>

            <div className="api-meta-row">
                <label className="toolbar-label" htmlFor="active-environment">
                    Environment
                </label>
                <select
                    id="active-environment"
                    className="tool-select"
                    value={activeEnvironmentId}
                    onChange={(e) => setActiveEnvironmentId(e.target.value)}
                    aria-label="Active environment"
                >
                    <option value="">None</option>
                    {environments.map((env) => (
                        <option key={env.id} value={env.id}>
                            {env.name}
                        </option>
                    ))}
                </select>
                <button type="button" className="tool-btn" onClick={() => setShowEnvEditor((v) => !v)} aria-pressed={showEnvEditor}>
                    <Settings2 size={14} aria-hidden />
                    {showEnvEditor ? 'Hide env' : 'Manage env'}
                </button>
                {activeEnvironment && <span className="stats-hint">Use {'{{baseUrl}}'} in URLs</span>}
            </div>

            {showEnvEditor && (
                <EnvironmentPanel
                    environments={environments}
                    setEnvironments={setEnvironments}
                    activeEnvironmentId={activeEnvironmentId}
                    setActiveEnvironmentId={setActiveEnvironmentId}
                    onClose={() => setShowEnvEditor(false)}
                />
            )}

            <div className="api-meta-row">
                <label className="toolbar-label" htmlFor="request-timeout-ms">
                    Timeout (ms)
                </label>
                <input
                    id="request-timeout-ms"
                    className="api-input timeout-input"
                    type="number"
                    min={MIN_TIMEOUT_MS}
                    max={MAX_TIMEOUT_MS}
                    value={timeoutMs}
                    onChange={(e) => setTimeoutMs(clampTimeoutMs(Number(e.target.value)))}
                />
                <span className="stats-hint">Ctrl/Cmd + Enter to send</span>
            </div>

            <div className="api-tools-row">
                <input
                    className="api-input curl-input"
                    value={curlInput}
                    onChange={(e) => setCurlInput(e.target.value)}
                    placeholder="Paste curl command"
                    aria-label="cURL command"
                />
                <button type="button" className="tool-btn" onClick={importCurl} disabled={!curlInput.trim()}>
                    <Upload size={14} aria-hidden />
                    Import cURL
                </button>
                <button type="button" className="tool-btn" onClick={copyCurl}>
                    <Copy size={14} aria-hidden />
                    {curlCopyState === 'ok' ? 'cURL copied' : curlCopyState === 'error' ? 'Copy failed' : 'Copy cURL'}
                </button>
            </div>

            <div className="api-tools-row">
                <input
                    className="api-input collection-input"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="Save request as..."
                    aria-label="Collection name"
                />
                <button type="button" className="tool-btn" onClick={saveCurrentCollection} disabled={!collectionName.trim()}>
                    <Save size={14} aria-hidden />
                    Save
                </button>
                <select
                    className="tool-select"
                    aria-label="Saved requests"
                    value={selectedCollectionId}
                    onChange={(e) => {
                        setSelectedCollectionId(e.target.value);
                        const found = collections.find((item) => item.id === e.target.value);
                        if (found) applySnapshot(found.snapshot);
                    }}
                >
                    <option value="" disabled>
                        Load saved request
                    </option>
                    {collections.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
                <button type="button" className="tool-btn danger" onClick={removeSelectedCollection} disabled={!selectedCollectionId}>
                    Delete saved
                </button>
                <button type="button" className="tool-btn danger" onClick={clearAllCollections} disabled={!collections.length}>
                    Clear saved
                </button>
                <button type="button" className="tool-btn" onClick={exportCollections} disabled={!collections.length && !environments.length}>
                    <DownloadCloud size={14} aria-hidden />
                    Export
                </button>
                <button type="button" className="tool-btn" onClick={() => importInputRef.current?.click()}>
                    <UploadCloud size={14} aria-hidden />
                    Import
                </button>
                <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="visually-hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void importCollections(file);
                        e.target.value = '';
                    }}
                />
                <select
                    className="tool-select"
                    aria-label="Recent history"
                    value=""
                    onChange={(e) => {
                        const found = history.find((item) => item.id === e.target.value);
                        if (found) applySnapshot(found.snapshot);
                    }}
                >
                    <option value="" disabled>
                        Recent history
                    </option>
                    {history.map((item) => (
                        <option key={item.id} value={item.id}>
                            [{item.status}] {item.snapshot.method} {item.snapshot.url}
                        </option>
                    ))}
                </select>
                <button type="button" className="tool-btn" onClick={clearHistory} disabled={!history.length}>
                    <History size={14} aria-hidden />
                    Clear history
                </button>
            </div>

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
                    placeholder="{{baseUrl}}/path or https://..."
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
                        {loading ? <Loader2 size={16} className="spin-icon" aria-hidden /> : <Send size={16} aria-hidden />}
                        Send
                    </button>
                </div>
            </div>
            <div
                className={`url-preview ${built !== displayUrl && displayUrl ? '' : 'url-preview-hidden'}`}
                aria-hidden={built === displayUrl || !displayUrl}
            >
                {built !== displayUrl && displayUrl ? `→ ${built}` : '\u00A0'}
            </div>
        </div>
    );
}
