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

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function sortJsonKeys(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => sortJsonKeys(item));
    }
    if (!isPlainObject(value)) {
        return value;
    }
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries.map(([key, child]) => [key, sortJsonKeys(child)]));
}

function isEmptyValue(value: unknown): boolean {
    if (value === null) return true;
    if (value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    if (isPlainObject(value)) return Object.keys(value).length === 0;
    return false;
}

export function stripEmptyJson(value: unknown): unknown {
    if (Array.isArray(value)) {
        const next = value.map((item) => stripEmptyJson(item)).filter((item) => !isEmptyValue(item));
        return next;
    }
    if (!isPlainObject(value)) {
        return value;
    }

    const nextEntries = Object.entries(value)
        .map(([key, child]) => [key, stripEmptyJson(child)] as const)
        .filter(([, child]) => !isEmptyValue(child));

    return Object.fromEntries(nextEntries);
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

export function formatJsonParseError(raw: string, error: SyntaxError): string {
    const match = error.message.match(/position (\d+)/i);
    if (!match) return error.message;

    const pos = Number(match[1]);
    const before = raw.slice(0, pos);
    const line = before.split('\n').length;
    const lastNewline = before.lastIndexOf('\n');
    const column = pos - lastNewline;
    return `${error.message} (line ${line}, column ${column})`;
}

export function formatJson(raw: string, indent: number): FormatJsonResult {
    const trimmed = raw.trim();
    if (!trimmed) return { result: '', status: 'idle' };
    try {
        const parsed = JSON.parse(trimmed);
        const formatted = JSON.stringify(parsed, null, indent);
        return { result: formatted, status: 'valid', stats: analyzeJson(parsed) };
    } catch (e) {
        return {
            result: raw,
            status: 'error',
            error: formatJsonParseError(raw, e as SyntaxError),
        };
    }
}

export interface ProcessJsonOptions {
    indent: number;
    compact: boolean;
    sortKeys: boolean;
    stripEmpty: boolean;
}

export interface ProcessJsonResult {
    output: string;
    status: FormatStatus;
    error?: string;
    stats: JsonStats | null;
    parsed: unknown | null;
}

/** Parse once, apply transforms, and stringify — used by the JSON formatter UI. */
export function processJson(raw: string, options: ProcessJsonOptions): ProcessJsonResult {
    const trimmed = raw.trim();
    if (!trimmed) {
        return { output: '', status: 'idle', stats: null, parsed: null };
    }

    try {
        let parsed: unknown = JSON.parse(trimmed);
        if (options.stripEmpty) parsed = stripEmptyJson(parsed);
        if (options.sortKeys) parsed = sortJsonKeys(parsed);

        const output = options.compact ? JSON.stringify(parsed) : JSON.stringify(parsed, null, options.indent);
        return {
            output,
            status: 'valid',
            stats: analyzeJson(parsed),
            parsed,
        };
    } catch (e) {
        return {
            output: raw,
            status: 'error',
            error: formatJsonParseError(trimmed, e as SyntaxError),
            stats: null,
            parsed: null,
        };
    }
}
