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
});
