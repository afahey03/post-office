import { encodeBasicAuth } from './base64';
import { buildUrlWithParams, type QueryParam } from './buildUrl';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';
export type BodyContentType = 'none' | 'application/json' | 'text/plain' | 'application/x-www-form-urlencoded';

export interface HeaderRow {
    key: string;
    value: string;
    enabled: boolean;
}

export interface AuthConfig {
    type: AuthType;
    bearerToken: string;
    basicUser: string;
    basicPass: string;
    apiKey: string;
    apiKeyHeader: string;
}

export function buildRequestHeaders(
    headerRows: HeaderRow[],
    auth: AuthConfig,
    bodyContentType: BodyContentType,
    hasBody: boolean,
): Record<string, string> {
    const headers: Record<string, string> = {};
    headerRows
        .filter((h) => h.enabled && h.key)
        .forEach((h) => {
            headers[h.key] = h.value;
        });

    if (auth.type === 'bearer' && auth.bearerToken) {
        headers.Authorization = `Bearer ${auth.bearerToken}`;
    }
    if (auth.type === 'basic' && auth.basicUser) {
        headers.Authorization = `Basic ${encodeBasicAuth(auth.basicUser, auth.basicPass)}`;
    }
    if (auth.type === 'apikey' && auth.apiKey) {
        headers[auth.apiKeyHeader || 'X-API-Key'] = auth.apiKey;
    }

    if (hasBody && bodyContentType !== 'none' && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = bodyContentType;
    }

    return headers;
}

export function resolveAbsoluteBase(url: string, origin = ''): string {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/') && origin) return `${origin}${trimmed}`;
    return trimmed;
}

export function resolveRequestUrl(
    url: string,
    params: QueryParam[],
    useProxy: boolean,
    origin = '',
): { fetchUrl: string; targetUrl: string } {
    const targetUrl = buildUrlWithParams(resolveAbsoluteBase(url, origin), params);
    if (!useProxy) {
        return { fetchUrl: targetUrl, targetUrl };
    }
    return { fetchUrl: origin ? `${origin}/api/proxy` : '/api/proxy', targetUrl };
}

export { buildUrlWithParams };
