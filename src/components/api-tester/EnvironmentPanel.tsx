import type { Environment } from '@/lib/environments';
import { uid } from '@/lib/apiTesterUtils';

interface EnvironmentPanelProps {
    environments: Environment[];
    setEnvironments: (envs: Environment[]) => void;
    activeEnvironmentId: string;
    setActiveEnvironmentId: (id: string) => void;
    onClose: () => void;
}

export default function EnvironmentPanel({
    environments,
    setEnvironments,
    activeEnvironmentId,
    setActiveEnvironmentId,
    onClose,
}: EnvironmentPanelProps) {
    const active = environments.find((e) => e.id === activeEnvironmentId) ?? environments[0] ?? null;

    const updateVariable = (envId: string, index: number, patch: Partial<{ key: string; value: string; enabled: boolean }>) => {
        setEnvironments(
            environments.map((env) =>
                env.id !== envId
                    ? env
                    : {
                          ...env,
                          variables: env.variables.map((v, i) => (i === index ? { ...v, ...patch } : v)),
                      },
            ),
        );
    };

    const addVariable = (envId: string) => {
        setEnvironments(
            environments.map((env) =>
                env.id !== envId ? env : { ...env, variables: [...env.variables, { key: '', value: '', enabled: true }] },
            ),
        );
    };

    const addEnvironment = () => {
        const next: Environment = { id: uid(), name: 'New Environment', variables: [{ key: 'baseUrl', value: '', enabled: true }] };
        setEnvironments([...environments, next]);
        setActiveEnvironmentId(next.id);
    };

    const removeEnvironment = (id: string) => {
        const next = environments.filter((e) => e.id !== id);
        setEnvironments(next);
        if (activeEnvironmentId === id) {
            setActiveEnvironmentId(next[0]?.id ?? '');
        }
    };

    return (
        <div className="env-panel">
            <div className="env-panel-header">
                <span className="panel-label">Environments</span>
                <button type="button" className="tool-btn" onClick={onClose}>
                    Close
                </button>
            </div>
            <p className="auth-hint">Use {'{{variableName}}'} in URLs, headers, params, and body values.</p>
            <div className="env-toolbar">
                <select
                    className="tool-select"
                    value={activeEnvironmentId}
                    onChange={(e) => setActiveEnvironmentId(e.target.value)}
                    aria-label="Active environment"
                >
                    <option value="">No environment</option>
                    {environments.map((env) => (
                        <option key={env.id} value={env.id}>
                            {env.name}
                        </option>
                    ))}
                </select>
                <button type="button" className="tool-btn" onClick={addEnvironment}>
                    Add environment
                </button>
                {active && (
                    <button type="button" className="tool-btn danger" onClick={() => removeEnvironment(active.id)}>
                        Delete
                    </button>
                )}
            </div>
            {active && (
                <div className="env-editor">
                    <input
                        className="api-input env-name-input"
                        value={active.name}
                        onChange={(e) =>
                            setEnvironments(environments.map((env) => (env.id === active.id ? { ...env, name: e.target.value } : env)))
                        }
                        placeholder="Environment name"
                        aria-label="Environment name"
                    />
                    <div className="kv-header-row">
                        <span />
                        <span className="kv-col-label">Variable</span>
                        <span className="kv-col-label">Value</span>
                        <span />
                    </div>
                    {active.variables.map((variable, index) => (
                        <div key={`${active.id}-${index}`} className="kv-row">
                            <input
                                type="checkbox"
                                checked={variable.enabled}
                                onChange={(e) => updateVariable(active.id, index, { enabled: e.target.checked })}
                                aria-label={`Enable ${variable.key || 'variable'}`}
                            />
                            <input
                                className="kv-input"
                                value={variable.key}
                                onChange={(e) => updateVariable(active.id, index, { key: e.target.value })}
                                placeholder="baseUrl"
                            />
                            <input
                                className="kv-input"
                                value={variable.value}
                                onChange={(e) => updateVariable(active.id, index, { value: e.target.value })}
                                placeholder="https://api.example.com"
                            />
                            <span />
                        </div>
                    ))}
                    <button type="button" className="tool-btn" onClick={() => addVariable(active.id)}>
                        Add variable
                    </button>
                </div>
            )}
        </div>
    );
}
