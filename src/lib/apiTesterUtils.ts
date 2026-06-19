import type { HttpMethod, AuthType, BodyContentType } from '@/lib/apiRequest';
import type { KeyValue } from '@/components/api-tester/types';
import { kvToRows } from '@/components/api-tester/types';
import type { RequestSnapshot } from '@/lib/apiStorage';
import { snapshotFormFields, type FormFieldRow } from '@/lib/multipart';

export const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: '#3dd68c',
    POST: '#6e6af0',
    PUT: '#f0a940',
    PATCH: '#f3ef06',
    DELETE: '#f06464',
    HEAD: '#89ddff',
    OPTIONS: '#c792ea',
};

export const PRESETS = [
    { label: 'Local echo', method: 'GET' as HttpMethod, url: '/api/echo', relative: true },
    { label: 'JSONPlaceholder post', method: 'GET' as HttpMethod, url: 'https://jsonplaceholder.typicode.com/posts/1' },
    { label: 'JokeAPI', method: 'GET' as HttpMethod, url: 'https://v2.jokeapi.dev/joke/Programming?safe-mode' },
];

export const DEFAULT_TIMEOUT_MS = 30_000;
export const MIN_TIMEOUT_MS = 1_000;
export const MAX_TIMEOUT_MS = 120_000;

export function uid(): string {
    return Math.random().toString(36).slice(2, 8);
}

export function clampTimeoutMs(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
    return Math.max(MIN_TIMEOUT_MS, Math.min(MAX_TIMEOUT_MS, Math.round(value)));
}

export function statusColor(code: number): string {
    if (code < 300) return 'var(--success)';
    if (code < 400) return 'var(--warning)';
    return 'var(--error)';
}

export function formatSize(text: string): string {
    const bytes = new TextEncoder().encode(text).length;
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function normalizeRows(rows: { key: string; value: string; enabled: boolean }[]) {
    return rows.filter((row) => row.key || row.value);
}

export function makeSnapshot(payload: {
    method: HttpMethod;
    url: string;
    params: KeyValue[];
    headers: KeyValue[];
    body: string;
    bodyContentType: BodyContentType;
    formFields: FormFieldRow[];
    authType: AuthType;
    apiKeyHeader: string;
    useProxy: boolean;
    timeoutMs: number;
}): RequestSnapshot {
    return {
        method: payload.method,
        url: payload.url,
        params: normalizeRows(kvToRows(payload.params)),
        headers: normalizeRows(kvToRows(payload.headers)),
        body: payload.body,
        bodyContentType: payload.bodyContentType,
        formFields: snapshotFormFields(payload.formFields),
        authType: payload.authType,
        apiKeyHeader: payload.apiKeyHeader,
        useProxy: payload.useProxy,
        timeoutMs: clampTimeoutMs(payload.timeoutMs),
    };
}

export function appendBlankRow(rows: { key: string; value: string; enabled: boolean }[]): {
    key: string;
    value: string;
    enabled: boolean;
}[] {
    const withRows = rows.length ? rows : [{ key: '', value: '', enabled: true }];
    if (!withRows.some((r) => !r.key)) {
        withRows.push({ key: '', value: '', enabled: true });
    }
    return withRows;
}

export function activeCount(list: KeyValue[]): number {
    return list.filter((i) => i.enabled && i.key).length;
}

export function updateKVList(
    list: KeyValue[],
    id: string,
    field: keyof KeyValue,
    val: string | boolean,
    emptyRow: () => KeyValue,
): KeyValue[] {
    const updated = list.map((item) => (item.id === id ? { ...item, [field]: val } : item));
    if (field === 'key' && val !== '' && !updated.some((i) => i.key === '' && i.id !== id)) {
        updated.push(emptyRow());
    }
    return updated;
}

export function removeKVFromList(list: KeyValue[], id: string, emptyRow: () => KeyValue): KeyValue[] {
    const filtered = list.filter((i) => i.id !== id);
    if (!filtered.length) filtered.push(emptyRow());
    return filtered;
}
