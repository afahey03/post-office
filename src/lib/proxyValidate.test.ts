import { describe, expect, it } from 'vitest';
import { assertProxyTargetAllowed } from './proxyValidate';

describe('assertProxyTargetAllowed', () => {
    it('allows public https URLs', () => {
        const url = assertProxyTargetAllowed('https://jsonplaceholder.typicode.com/posts/1');
        expect(url.hostname).toBe('jsonplaceholder.typicode.com');
    });

    it('blocks localhost', () => {
        expect(() => assertProxyTargetAllowed('http://localhost:3000/api')).toThrow(/localhost/i);
    });

    it('blocks private IPs', () => {
        expect(() => assertProxyTargetAllowed('http://192.168.1.1/')).toThrow(/private/i);
    });
});
