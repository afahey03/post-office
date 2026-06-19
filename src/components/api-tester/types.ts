import type { HttpMethod, AuthType, BodyContentType } from '@/lib/apiRequest';

export type TabKey = 'params' | 'headers' | 'body' | 'auth';
export type ResponseTab = 'body' | 'headers' | 'info';

export interface KeyValue {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

export interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
    size: string;
}

export function uid(): string {
    return Math.random().toString(36).slice(2, 8);
}

export function emptyKV(): KeyValue {
    return { id: uid(), key: '', value: '', enabled: true };
}

export function kvToRows(list: KeyValue[]) {
    return list.map(({ key, value, enabled }) => ({ key, value, enabled }));
}

export function rowsToKV(rows: { key: string; value: string; enabled: boolean }[]): KeyValue[] {
    const items = rows.map((r) => ({ id: uid(), ...r }));
    if (!items.some((i) => !i.key)) items.push(emptyKV());
    return items.length ? items : [emptyKV()];
}

export interface ApiTesterPreset {
    label: string;
    method: HttpMethod;
    url: string;
    relative?: boolean;
}

export interface AuthState {
    authType: AuthType;
    bearerToken: string;
    basicUser: string;
    basicPass: string;
    apiKey: string;
    apiKeyHeader: string;
}

export interface BodyState {
    body: string;
    bodyContentType: BodyContentType;
}
