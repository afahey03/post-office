import { describe, expect, it } from 'vitest';
import { buildVariableMap, substituteVariables } from './environments';

describe('substituteVariables', () => {
    it('replaces known variables', () => {
        expect(substituteVariables('{{baseUrl}}/users', { baseUrl: 'https://api.example.com' })).toBe(
            'https://api.example.com/users',
        );
    });

    it('leaves unknown placeholders intact', () => {
        expect(substituteVariables('{{missing}}/x', {})).toBe('{{missing}}/x');
    });
});

describe('buildVariableMap', () => {
    it('maps enabled variables only', () => {
        const map = buildVariableMap({
            id: '1',
            name: 'Dev',
            variables: [
                { key: 'baseUrl', value: 'https://dev.example.com', enabled: true },
                { key: 'token', value: 'secret', enabled: false },
            ],
        });
        expect(map).toEqual({ baseUrl: 'https://dev.example.com' });
    });
});
