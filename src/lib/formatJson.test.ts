import { describe, expect, it } from 'vitest';
import { analyzeJson, formatJson } from './formatJson';

describe('formatJson', () => {
    it('returns idle for empty input', () => {
        expect(formatJson('  ', 2)).toEqual({ result: '', status: 'idle' });
    });

    it('formats valid JSON', () => {
        const res = formatJson('{"a":1}', 2);
        expect(res.status).toBe('valid');
        expect(res.result).toBe('{\n  "a": 1\n}');
        expect(res.stats?.keys).toBe(1);
    });

    it('returns error for invalid JSON', () => {
        const res = formatJson('{bad}', 2);
        expect(res.status).toBe('error');
        expect(res.error).toBeTruthy();
    });
});

describe('analyzeJson', () => {
    it('counts object keys but not array indices', () => {
        const stats = analyzeJson({ items: [1, 2], name: 'x' });
        expect(stats.keys).toBe(2);
        expect(stats.depth).toBeGreaterThan(0);
    });
});
