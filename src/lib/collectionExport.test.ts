import { describe, expect, it } from 'vitest';
import { buildExportBundle, parseImportBundle } from './collectionExport';

describe('collectionExport', () => {
    it('round-trips export bundles', () => {
        const bundle = buildExportBundle(
            [{ id: '1', name: 'Test', createdAt: '2024-01-01', snapshot: { method: 'GET', url: '/x', params: [], headers: [], body: '', bodyContentType: 'application/json', formFields: [], authType: 'none', apiKeyHeader: 'X-API-Key', useProxy: false, timeoutMs: 30000 } }],
            [{ id: 'env', name: 'Dev', variables: [{ key: 'baseUrl', value: 'http://localhost', enabled: true }] }],
            'env',
        );
        const parsed = parseImportBundle(JSON.stringify(bundle));
        expect(parsed.collections).toHaveLength(1);
        expect(parsed.environments).toHaveLength(1);
        expect(parsed.activeEnvironmentId).toBe('env');
    });
});
