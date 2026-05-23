const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '[::1]',
    '::1',
]);

function isPrivateIpv4(host: string): boolean {
    const parts = host.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
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

    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost')) {
        throw new Error('Requests to localhost are not allowed');
    }

    if (isPrivateIpv4(host)) {
        throw new Error('Requests to private networks are not allowed');
    }

    return parsed;
}

export const PROXY_MAX_BODY_BYTES = 1024 * 1024;
export const PROXY_TIMEOUT_MS = 30_000;
