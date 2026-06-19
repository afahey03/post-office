import dns from 'node:dns/promises';

const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '[::1]',
    '::1',
    '::',
]);

export function isPrivateIpv4(host: string): boolean {
    const parts = host.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
}

export function isPrivateIpv6(host: string): boolean {
    const normalized = host.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (
        normalized.startsWith('fe8') ||
        normalized.startsWith('fe9') ||
        normalized.startsWith('fea') ||
        normalized.startsWith('feb')
    ) {
        return true;
    }
    if (normalized.startsWith('::ffff:')) {
        const mapped = normalized.slice('::ffff:'.length);
        if (isPrivateIpv4(mapped)) return true;
    }
    return false;
}

function decodeDecimalIpv4(hostname: string): string | null {
    if (!/^\d+$/.test(hostname)) return null;
    const num = Number(hostname);
    if (!Number.isInteger(num) || num < 0 || num > 0xffffffff) return null;
    return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}

function decodeHexIpv4(hostname: string): string | null {
    if (!/^0x[0-9a-f]+$/i.test(hostname)) return null;
    const num = parseInt(hostname, 16);
    if (num < 0 || num > 0xffffffff) return null;
    return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}

/** Normalize alternate IP encodings (decimal, hex) to dotted IPv4 when applicable. */
export function normalizeHostname(hostname: string): string {
    const lower = hostname.toLowerCase();
    return decodeDecimalIpv4(lower) ?? decodeHexIpv4(lower) ?? lower;
}

function isIpLiteral(host: string): boolean {
    if (host.includes(':') || host.startsWith('[')) return true;
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host);
}

export function assertHostNotBlocked(host: string): void {
    const normalized = normalizeHostname(host);

    if (
        BLOCKED_HOSTNAMES.has(normalized) ||
        normalized.endsWith('.localhost') ||
        normalized.endsWith('.local') ||
        normalized.endsWith('.internal')
    ) {
        throw new Error('Requests to localhost are not allowed');
    }

    if (isPrivateIpv4(normalized) || isPrivateIpv6(normalized)) {
        throw new Error('Requests to private networks are not allowed');
    }
}

export function assertProxyTargetAllowed(targetUrl: string): URL {
    let parsed: URL;
    try {
        parsed = new URL(targetUrl);
    } catch {
        throw new Error('Invalid target URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Only http and https URLs are allowed');
    }

    assertHostNotBlocked(parsed.hostname);
    return parsed;
}

export async function assertProxyTargetAllowedAsync(targetUrl: string): Promise<URL> {
    const parsed = assertProxyTargetAllowed(targetUrl);
    const host = parsed.hostname;

    if (isIpLiteral(host)) {
        return parsed;
    }

    try {
        const results = await dns.lookup(host, { all: true });
        for (const { address } of results) {
            assertHostNotBlocked(address);
        }
    } catch (e) {
        if ((e as Error).message.includes('not allowed')) {
            throw e;
        }
        throw new Error('Unable to resolve target hostname');
    }

    return parsed;
}

export const PROXY_MAX_BODY_BYTES = 1024 * 1024;
export const PROXY_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
export const PROXY_TIMEOUT_MS = 30_000;
export const PROXY_MIN_TIMEOUT_MS = 1_000;
export const PROXY_MAX_TIMEOUT_MS = 120_000;

export function clampProxyTimeoutMs(value: number | undefined): number {
    if (!value || !Number.isFinite(value)) return PROXY_TIMEOUT_MS;
    return Math.max(PROXY_MIN_TIMEOUT_MS, Math.min(PROXY_MAX_TIMEOUT_MS, Math.round(value)));
}

export function isProxyEnabled(): boolean {
    return process.env.PROXY_ENABLED !== 'false';
}
