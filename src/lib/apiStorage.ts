export interface PersistedApiState {
    method: string;
    url: string;
    params: { key: string; value: string; enabled: boolean }[];
    headers: { key: string; value: string; enabled: boolean }[];
    body: string;
    bodyContentType: string;
    authType: string;
    apiKeyHeader: string;
    useProxy: boolean;
}

const STORAGE_KEY = 'postoffice-api-tester';

export function loadApiState(): Partial<PersistedApiState> | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as Partial<PersistedApiState>;
    } catch {
        return null;
    }
}

export function saveApiState(state: PersistedApiState): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* quota or private mode */
    }
}
