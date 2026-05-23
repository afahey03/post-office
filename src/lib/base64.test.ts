import { describe, expect, it } from 'vitest';
import { encodeBasicAuth } from './base64';

describe('encodeBasicAuth', () => {
    it('encodes ascii credentials', () => {
        expect(encodeBasicAuth('user', 'pass')).toBe(btoa('user:pass'));
    });

    it('encodes utf-8 credentials', () => {
        const encoded = encodeBasicAuth('user', 'päss');
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        expect(decoded).toBe('user:päss');
    });
});
