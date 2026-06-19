import type { AuthType } from '@/lib/apiRequest';

interface AuthConfigProps {
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
}

export default function AuthConfig({
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
}: AuthConfigProps) {
    return (
        <div>
            <p className="auth-hint">Credentials are kept in memory only — never saved to local storage.</p>
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
