import { describe, expect, it } from 'vitest';
import { parseCurlCommand, requestToCurl } from './curl';

describe('parseCurlCommand', () => {
    it('parses method, headers, body, and url', () => {
        const parsed = parseCurlCommand(
            "curl -X POST -H 'Content-Type: application/json' -H 'X-Test: abc' --data-raw '{\"a\":1}' https://api.example.com/items",
        );
        expect(parsed.method).toBe('POST');
        expect(parsed.url).toBe('https://api.example.com/items');
        expect(parsed.headers.find((h) => h.key === 'Content-Type')?.value).toBe('application/json');
        expect(parsed.body).toBe('{"a":1}');
        expect(parsed.bodyContentType).toBe('application/json');
    });

    it('throws for non-curl command', () => {
        expect(() => parseCurlCommand('wget https://example.com')).toThrow(/must start with curl/i);
    });
});

describe('requestToCurl', () => {
    it('builds cURL command with body and headers', () => {
        const curl = requestToCurl({
            method: 'POST',
            url: 'https://api.example.com/items',
            params: [],
            headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
            body: '{"a":1}',
            bodyContentType: 'application/json',
            formFields: [],
            authType: 'none',
            apiKeyHeader: 'X-API-Key',
            useProxy: false,
            timeoutMs: 30000,
        });
        expect(curl).toContain('curl');
        expect(curl).toContain('-X POST');
        expect(curl).toContain('Content-Type: application/json');
        expect(curl).toContain('--data-raw');
    });

    it('includes query params in the URL', () => {
        const curl = requestToCurl({
            method: 'GET',
            url: 'https://api.example.com/items',
            params: [{ key: 'page', value: '2', enabled: true }],
            headers: [],
            body: '',
            bodyContentType: 'application/json',
            formFields: [],
            authType: 'none',
            apiKeyHeader: 'X-API-Key',
            useProxy: false,
            timeoutMs: 30000,
        });
        expect(curl).toContain('page=2');
    });
});
