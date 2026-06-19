import { describe, expect, it } from 'vitest';
import { validateJsonAgainstSchema } from './jsonSchema';

describe('validateJsonAgainstSchema', () => {
    const schema = JSON.stringify({
        type: 'object',
        required: ['id', 'name'],
        properties: {
            id: { type: 'number' },
            name: { type: 'string' },
        },
    });

    it('passes valid data', () => {
        const result = validateJsonAgainstSchema({ id: 1, name: 'Alice' }, schema);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('reports schema violations', () => {
        const result = validateJsonAgainstSchema({ id: 'x' }, schema);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns valid when schema is empty', () => {
        const result = validateJsonAgainstSchema({ any: true }, '  ');
        expect(result.valid).toBe(true);
    });
});
