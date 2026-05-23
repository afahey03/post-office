import { describe, expect, it } from 'vitest';
import { isJsonString, syntaxHighlight } from './jsonHighlight';

describe('syntaxHighlight', () => {
    it('escapes HTML and wraps tokens', () => {
        const html = syntaxHighlight('{"a":"<script>"}');
        expect(html).not.toContain('<script>');
        expect(html).toContain('json-key');
        expect(html).toContain('&lt;script&gt;');
    });
});

describe('isJsonString', () => {
    it('detects valid JSON', () => {
        expect(isJsonString('{"a":1}')).toBe(true);
        expect(isJsonString('not json')).toBe(false);
    });
});
