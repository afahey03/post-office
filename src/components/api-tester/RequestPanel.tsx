import type { BodyContentType } from '@/lib/apiRequest';
import type { ApiTesterState } from '@/hooks/useApiTester';
import type { TabKey } from '@/components/api-tester/types';
import KVEditor from '@/components/api-tester/KVEditor';
import AuthConfig from '@/components/api-tester/AuthConfig';
import FormDataEditor from '@/components/api-tester/FormDataEditor';

interface RequestPanelProps {
    state: ApiTesterState;
}

export default function RequestPanel({ state }: RequestPanelProps) {
    const {
        tab,
        setTab,
        params,
        setParams,
        headers,
        setHeaders,
        body,
        setBody,
        bodyContentType,
        setBodyContentType,
        formFields,
        setFormFields,
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
        methodSkipsBody,
        activeCount,
        handleFormFile,
    } = state;

    return (
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
                        keyPlaceholder={tab === 'params' ? 'parameter' : 'Header-Name'}
                        valPlaceholder="value"
                    />
                )}
                {tab === 'body' && (
                    <div className="body-tab">
                        <div className="body-ct-row">
                            <label className="panel-label" htmlFor="body-content-type">
                                Content-Type
                            </label>
                            <select
                                id="body-content-type"
                                className="tool-select"
                                value={bodyContentType}
                                onChange={(e) => setBodyContentType(e.target.value as BodyContentType)}
                            >
                                <option value="application/json">application/json</option>
                                <option value="text/plain">text/plain</option>
                                <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                                <option value="multipart/form-data">multipart/form-data</option>
                                <option value="none">none</option>
                            </select>
                            {methodSkipsBody && <span className="body-skip-hint">Ignored for {state.method}</span>}
                        </div>
                        {bodyContentType === 'multipart/form-data' ? (
                            <FormDataEditor fields={formFields} setFields={setFormFields} onFileSelect={handleFormFile} />
                        ) : (
                            <textarea
                                className="body-input"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder={bodyContentType === 'application/json' ? '{\n  "key": "value"\n}' : ''}
                                spellCheck={false}
                                aria-label="Request body"
                            />
                        )}
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
    );
}
