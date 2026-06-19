import { describe, expect, it } from 'vitest';
import {
    assertHostNotBlocked,
    assertProxyTargetAllowed,
    clampProxyTimeoutMs,
    normalizeHostname,
} from './proxyValidate';

describe('normalizeHostname', () => {
    it('decodes decimal IPv4', () => {
        expect(normalizeHostname('2130706433')).toBe('127.0.0.1');
    });

    it('decodes hex IPv4', () => {
        expect(normalizeHostname('0x7f000001')).toBe('127.0.0.1');
    });

    it('leaves normal hostnames unchanged', () => {
        expect(normalizeHostname('Example.COM')).toBe('example.com');
    });
});

describe('assertHostNotBlocked', () => {
    it('blocks decimal-encoded loopback', () => {
        expect(() => assertHostNotBlocked('2130706433')).toThrow(/not allowed/i);
    });

    it('blocks hex-encoded loopback', () => {
        expect(() => assertHostNotBlocked('0x7f000001')).toThrow(/not allowed/i);
    });
});

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

    it('blocks decimal-encoded private targets', () => {
        expect(() => assertProxyTargetAllowed('http://2130706433/')).toThrow(/not allowed/i);
    });

    it('blocks .local hostnames', () => {
        expect(() => assertProxyTargetAllowed('http://printer.local/status')).toThrow(/localhost|private/i);
    });

    it('blocks IPv6 private ranges', () => {
        expect(() => assertProxyTargetAllowed('http://[fc00::1]/')).toThrow(/private/i);
    });
});

describe('clampProxyTimeoutMs', () => {
    it('clamps low and high values', () => {
        expect(clampProxyTimeoutMs(100)).toBe(1000);
        expect(clampProxyTimeoutMs(999999)).toBe(120000);
    });

    it('falls back for invalid values', () => {
        expect(clampProxyTimeoutMs(undefined)).toBe(30000);
        expect(clampProxyTimeoutMs(Number.NaN)).toBe(30000);
    });
});
