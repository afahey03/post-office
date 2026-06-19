import type { SavedRequestCollection } from '@/lib/apiStorage';
import type { Environment } from '@/lib/environments';

export const COLLECTION_EXPORT_VERSION = 1;

export interface CollectionExportBundle {
    version: number;
    exportedAt: string;
    collections: SavedRequestCollection[];
    environments: Environment[];
    activeEnvironmentId: string;
}

export function buildExportBundle(
    collections: SavedRequestCollection[],
    environments: Environment[],
    activeEnvironmentId: string,
): CollectionExportBundle {
    return {
        version: COLLECTION_EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        collections,
        environments,
        activeEnvironmentId,
    };
}

export function parseImportBundle(raw: string): CollectionExportBundle {
    const parsed = JSON.parse(raw) as Partial<CollectionExportBundle>;
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid export file');
    }
    if (!Array.isArray(parsed.collections)) {
        throw new Error('Export file is missing collections');
    }
    if (!Array.isArray(parsed.environments)) {
        throw new Error('Export file is missing environments');
    }
    return {
        version: parsed.version ?? COLLECTION_EXPORT_VERSION,
        exportedAt: parsed.exportedAt ?? new Date().toISOString(),
        collections: parsed.collections as SavedRequestCollection[],
        environments: parsed.environments as Environment[],
        activeEnvironmentId: parsed.activeEnvironmentId ?? '',
    };
}

export function downloadJsonFile(filename: string, data: unknown): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}
