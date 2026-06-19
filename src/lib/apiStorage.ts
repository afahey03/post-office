import type { FormFieldSnapshot } from '@/lib/multipart';

export interface PersistedApiState {
    method: string;
    url: string;
    params: { key: string; value: string; enabled: boolean }[];
    headers: { key: string; value: string; enabled: boolean }[];
    body: string;
    bodyContentType: string;
    formFields: FormFieldSnapshot[];
    authType: string;
    apiKeyHeader: string;
    useProxy: boolean;
    timeoutMs: number;
}

const STORAGE_KEY = 'postoffice-api-tester';
const HISTORY_KEY = 'postoffice-api-history';
const COLLECTIONS_KEY = 'postoffice-api-collections';
const HISTORY_LIMIT = 20;

export interface RequestSnapshot {
    method: string;
    url: string;
    params: { key: string; value: string; enabled: boolean }[];
    headers: { key: string; value: string; enabled: boolean }[];
    body: string;
    bodyContentType: string;
    formFields: FormFieldSnapshot[];
    authType: string;
    apiKeyHeader: string;
    useProxy: boolean;
    timeoutMs: number;
}

export interface ApiHistoryEntry {
    id: string;
    timestamp: string;
    status: number;
    durationMs: number;
    snapshot: RequestSnapshot;
}

export interface SavedRequestCollection {
    id: string;
    name: string;
    createdAt: string;
    snapshot: RequestSnapshot;
}

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

function safeParseArray<T>(raw: string | null): T[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        return [];
    }
}

export function loadApiHistory(): ApiHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    return safeParseArray<ApiHistoryEntry>(sessionStorage.getItem(HISTORY_KEY));
}

export function pushApiHistoryEntry(entry: ApiHistoryEntry): void {
    if (typeof window === 'undefined') return;
    try {
        const history = loadApiHistory();
        const next = [entry, ...history].slice(0, HISTORY_LIMIT);
        sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
        /* quota or private mode */
    }
}

export function clearApiHistory(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(HISTORY_KEY);
}

export function loadApiCollections(): SavedRequestCollection[] {
    if (typeof window === 'undefined') return [];
    return safeParseArray<SavedRequestCollection>(localStorage.getItem(COLLECTIONS_KEY));
}

export function saveApiCollections(collections: SavedRequestCollection[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    } catch {
        /* quota or private mode */
    }
}

/** Backfill snapshots saved before formFields existed. */
export function normalizeSnapshot(snapshot: Partial<RequestSnapshot>): RequestSnapshot {
    return {
        method: snapshot.method ?? 'GET',
        url: snapshot.url ?? '',
        params: snapshot.params ?? [],
        headers: snapshot.headers ?? [],
        body: snapshot.body ?? '',
        bodyContentType: snapshot.bodyContentType ?? 'application/json',
        formFields: snapshot.formFields ?? [],
        authType: snapshot.authType ?? 'none',
        apiKeyHeader: snapshot.apiKeyHeader ?? 'X-API-Key',
        useProxy: Boolean(snapshot.useProxy),
        timeoutMs: snapshot.timeoutMs ?? 30_000,
    };
}
