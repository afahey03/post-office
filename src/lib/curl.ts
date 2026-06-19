import type { BodyContentType, HttpMethod } from './apiRequest';
import type { RequestSnapshot } from './apiStorage';
import { buildUrlWithParams } from './buildUrl';

interface CurlTokenizeState {
    inSingle: boolean;
    inDouble: boolean;
    escaping: boolean;
    current: string;
}

export interface ParsedCurlRequest {
    method: HttpMethod;
    url: string;
    headers: { key: string; value: string; enabled: boolean }[];
    body: string;
    bodyContentType: BodyContentType;
}

const METHOD_SET = new Set<HttpMethod>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

function tokenize(command: string): string[] {
    const out: string[] = [];
    const state: CurlTokenizeState = {
        inSingle: false,
        inDouble: false,
        escaping: false,
        current: '',
    };

    for (let i = 0; i < command.length; i += 1) {
        const ch = command[i];

        if (state.escaping) {
            state.current += ch;
            state.escaping = false;
            continue;
        }

        if (ch === '\\' && !state.inSingle) {
            state.escaping = true;
            continue;
        }

        if (ch === "'" && !state.inDouble) {
            state.inSingle = !state.inSingle;
            continue;
        }

        if (ch === '"' && !state.inSingle) {
            state.inDouble = !state.inDouble;
            continue;
        }

        if (!state.inSingle && !state.inDouble && /\s/.test(ch)) {
            if (state.current) {
                out.push(state.current);
                state.current = '';
            }
            continue;
        }

        state.current += ch;
    }

    if (state.current) {
        out.push(state.current);
    }

    return out;
}

function parseHeader(header: string): { key: string; value: string } | null {
    const idx = header.indexOf(':');
    if (idx <= 0) return null;
    return {
        key: header.slice(0, idx).trim(),
        value: header.slice(idx + 1).trim(),
    };
}

function inferBodyType(headers: { key: string; value: string; enabled: boolean }[]): BodyContentType {
    const contentType = headers.find((h) => h.key.toLowerCase() === 'content-type')?.value.toLowerCase() || '';
    if (contentType.includes('application/json')) return 'application/json';
    if (contentType.includes('application/x-www-form-urlencoded')) return 'application/x-www-form-urlencoded';
    if (contentType.includes('text/plain')) return 'text/plain';
    return 'application/json';
}

export function parseCurlCommand(command: string): ParsedCurlRequest {
    const trimmed = command.trim();
    if (!trimmed) throw new Error('Empty command');

    const tokens = tokenize(trimmed);
    if (!tokens.length || tokens[0].toLowerCase() !== 'curl') {
        throw new Error('Command must start with curl');
    }

    let method: HttpMethod = 'GET';
    let url = '';
    const headers: { key: string; value: string; enabled: boolean }[] = [];
    let body = '';

    for (let i = 1; i < tokens.length; i += 1) {
        const token = tokens[i];

        if (token === '-X' || token === '--request') {
            const next = (tokens[i + 1] || '').toUpperCase();
            if (!METHOD_SET.has(next as HttpMethod)) {
                throw new Error(`Unsupported HTTP method: ${next || 'unknown'}`);
            }
            method = next as HttpMethod;
            i += 1;
            continue;
        }

        if (token === '-H' || token === '--header') {
            const next = tokens[i + 1] || '';
            const parsed = parseHeader(next);
            if (parsed) headers.push({ ...parsed, enabled: true });
            i += 1;
            continue;
        }

        if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
            body = tokens[i + 1] || '';
            i += 1;
            if (method === 'GET') method = 'POST';
            continue;
        }

        if (token === '--url') {
            url = tokens[i + 1] || '';
            i += 1;
            continue;
        }

        if (/^https?:\/\//i.test(token)) {
            url = token;
        }
    }

    if (!url) {
        throw new Error('No URL found in cURL command');
    }

    return {
        method,
        url,
        headers: headers.length ? headers : [{ key: '', value: '', enabled: true }],
        body,
        bodyContentType: body ? inferBodyType(headers) : 'application/json',
    };
}

function quote(value: string): string {
    if (!value) return "''";
    if (/^[a-zA-Z0-9_./:@?=&%-]+$/.test(value)) return value;
    return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function requestToCurl(snapshot: RequestSnapshot): string {
    const parts = ['curl'];
    const fullUrl = buildUrlWithParams(snapshot.url, snapshot.params);

    if (snapshot.method !== 'GET') {
        parts.push('-X', snapshot.method);
    }

    snapshot.headers
        .filter((h) => h.enabled && h.key)
        .forEach((h) => {
            parts.push('-H', quote(`${h.key}: ${h.value}`));
        });

    if (snapshot.body && !['GET', 'HEAD'].includes(snapshot.method)) {
        parts.push('--data-raw', quote(snapshot.body));
    }

    parts.push(quote(fullUrl));
    return parts.join(' ');
}
