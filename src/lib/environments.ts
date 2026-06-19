export interface EnvironmentVariable {
    key: string;
    value: string;
    enabled: boolean;
}

export interface Environment {
    id: string;
    name: string;
    variables: EnvironmentVariable[];
}

const ENVIRONMENTS_KEY = 'postoffice-environments';
const ACTIVE_ENV_KEY = 'postoffice-active-environment';

const VAR_PATTERN = /\{\{([^}]+)\}\}/g;

export const DEFAULT_ENVIRONMENTS: Environment[] = [
    {
        id: 'dev',
        name: 'Development',
        variables: [{ key: 'baseUrl', value: 'http://localhost:3000', enabled: true }],
    },
    {
        id: 'staging',
        name: 'Staging',
        variables: [{ key: 'baseUrl', value: 'https://staging.example.com', enabled: true }],
    },
    {
        id: 'prod',
        name: 'Production',
        variables: [{ key: 'baseUrl', value: 'https://api.example.com', enabled: true }],
    },
];

export function substituteVariables(text: string, variables: Record<string, string>): string {
    if (!text) return text;
    return text.replace(VAR_PATTERN, (_, key: string) => {
        const trimmed = key.trim();
        return Object.prototype.hasOwnProperty.call(variables, trimmed) ? variables[trimmed]! : `{{${trimmed}}}`;
    });
}

export function buildVariableMap(environment: Environment | null | undefined): Record<string, string> {
    if (!environment) return {};
    const map: Record<string, string> = {};
    environment.variables
        .filter((v) => v.enabled && v.key)
        .forEach((v) => {
            map[v.key] = v.value;
        });
    return map;
}

export function loadEnvironments(): Environment[] {
    if (typeof window === 'undefined') return DEFAULT_ENVIRONMENTS;
    try {
        const raw = localStorage.getItem(ENVIRONMENTS_KEY);
        if (!raw) return DEFAULT_ENVIRONMENTS;
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) && parsed.length ? (parsed as Environment[]) : DEFAULT_ENVIRONMENTS;
    } catch {
        return DEFAULT_ENVIRONMENTS;
    }
}

export function saveEnvironments(environments: Environment[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(environments));
    } catch {
        /* quota */
    }
}

export function loadActiveEnvironmentId(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(ACTIVE_ENV_KEY) || '';
}

export function saveActiveEnvironmentId(id: string): void {
    if (typeof window === 'undefined') return;
    try {
        if (id) localStorage.setItem(ACTIVE_ENV_KEY, id);
        else localStorage.removeItem(ACTIVE_ENV_KEY);
    } catch {
        /* ignore */
    }
}
