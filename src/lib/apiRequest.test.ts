import { describe, expect, it } from 'vitest';
import { buildRequestHeaders, resolveAbsoluteBase, resolveRequestUrl } from './apiRequest';

describe('buildRequestHeaders', () => {
    it('adds bearer auth and content type', () => {
        const headers = buildRequestHeaders(
            [],
            { type: 'bearer', bearerToken: 'tok', basicUser: '', basicPass: '', apiKey: '', apiKeyHeader: 'X-API-Key' },
            'application/json',
            true,
        );
        expect(headers.Authorization).toBe('Bearer tok');
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('skips content type when none', () => {
        const headers = buildRequestHeaders(
            [],
            { type: 'none', bearerToken: '', basicUser: '', basicPass: '', apiKey: '', apiKeyHeader: 'X-API-Key' },
            'none',
            true,
        );
        expect(headers['Content-Type']).toBeUndefined();
    });

    it('skips content type for multipart bodies', () => {
        const headers = buildRequestHeaders(
            [],
            { type: 'none', bearerToken: '', basicUser: '', basicPass: '', apiKey: '', apiKeyHeader: 'X-API-Key' },
            'multipart/form-data',
            true,
        );
        expect(headers['Content-Type']).toBeUndefined();
    });

    it('does not overwrite explicit content-type header', () => {
        const headers = buildRequestHeaders(
            [{ key: 'content-type', value: 'text/plain', enabled: true }],
            { type: 'none', bearerToken: '', basicUser: '', basicPass: '', apiKey: '', apiKeyHeader: 'X-API-Key' },
            'application/json',
            true,
        );
        expect(headers['content-type']).toBe('text/plain');
        expect(headers['Content-Type']).toBeUndefined();
    });

    it('lets auth header override user-provided authorization', () => {
        const headers = buildRequestHeaders(
            [{ key: 'Authorization', value: 'Basic old', enabled: true }],
            { type: 'bearer', bearerToken: 'newtoken', basicUser: '', basicPass: '', apiKey: '', apiKeyHeader: 'X-API-Key' },
            'none',
            false,
        );
        expect(headers.Authorization).toBe('Bearer newtoken');
    });
});

describe('resolveAbsoluteBase', () => {
    it('prefixes relative paths with origin', () => {
        expect(resolveAbsoluteBase('/api/echo', 'http://localhost:3000')).toBe('http://localhost:3000/api/echo');
    });
});

describe('resolveRequestUrl', () => {
    it('returns proxy endpoint when enabled', () => {
        const res = resolveRequestUrl('https://example.com', [], true, 'http://localhost:3000');
        expect(res.fetchUrl).toBe('http://localhost:3000/api/proxy');
        expect(res.targetUrl).toBe('https://example.com');
    });

    it('falls back to relative proxy endpoint without origin', () => {
        const res = resolveRequestUrl('https://example.com', [], true);
        expect(res.fetchUrl).toBe('/api/proxy');
    });

    it('substitutes environment variables in URL and params', () => {
        const res = resolveRequestUrl(
            '{{baseUrl}}/users',
            [{ key: 'q', value: '{{term}}', enabled: true }],
            false,
            '',
            { baseUrl: 'https://api.example.com', term: 'hello' },
        );
        expect(res.targetUrl).toBe('https://api.example.com/users?q=hello');
    });
});
