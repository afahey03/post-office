export type FormatStatus = 'idle' | 'valid' | 'error';

export interface JsonStats {
    /** Object property count (array indices are not counted). */
    keys: number;
    /** Maximum nesting depth from the root. */
    depth: number;
    size: string;
}

export interface FormatJsonResult {
    result: string;
    status: FormatStatus;
    error?: string;
    stats?: JsonStats;
}

export function analyzeJson(obj: unknown): JsonStats {
    let keyCount = 0;
    let maxDepth = 0;

    function traverse(value: unknown, depth: number) {
        maxDepth = Math.max(maxDepth, depth);
        if (Array.isArray(value)) {
            value.forEach((item) => traverse(item, depth + 1));
        } else if (value && typeof value === 'object') {
            const keys = Object.keys(value as object);
            keyCount += keys.length;
            keys.forEach((k) => traverse((value as Record<string, unknown>)[k], depth + 1));
        }
    }

    traverse(obj, 0);
    const bytes = JSON.stringify(obj).length;
    const size = bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`;
    return { keys: keyCount, depth: maxDepth, size };
}

export function formatJson(raw: string, indent: number): FormatJsonResult {
    const trimmed = raw.trim();
    if (!trimmed) return { result: '', status: 'idle' };
    try {
        const parsed = JSON.parse(trimmed);
        const formatted = JSON.stringify(parsed, null, indent);
        return { result: formatted, status: 'valid', stats: analyzeJson(parsed) };
    } catch (e) {
        return { result: raw, status: 'error', error: (e as Error).message };
    }
}
