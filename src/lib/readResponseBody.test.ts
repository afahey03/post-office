import { describe, expect, it } from 'vitest';
import { readResponseBodyWithLimit } from './readResponseBody';

describe('readResponseBodyWithLimit', () => {
    it('reads body within limit', async () => {
        const response = new Response('hello');
        await expect(readResponseBodyWithLimit(response, 10)).resolves.toBe('hello');
    });

    it('throws when body exceeds limit', async () => {
        const response = new Response('hello world');
        await expect(readResponseBodyWithLimit(response, 5)).rejects.toThrow(/too large/i);
    });
});
