import { assertProxyTargetAllowed, PROXY_MAX_BODY_BYTES, PROXY_TIMEOUT_MS } from '@/lib/proxyValidate';

const FORWARD_HEADER_BLOCK = new Set([
    'host',
    'connection',
    'content-length',
    'transfer-encoding',
    'keep-alive',
    'proxy-authorization',
    'proxy-connection',
]);

interface ProxyRequestBody {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
}

export async function POST(request: Request) {
    let payload: ProxyRequestBody;
    try {
        payload = (await request.json()) as ProxyRequestBody;
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { url, method = 'GET', headers = {}, body } = payload;
    if (!url || typeof url !== 'string') {
        return Response.json({ error: 'url is required' }, { status: 400 });
    }

    let target: URL;
    try {
        target = assertProxyTargetAllowed(url);
    } catch (e) {
        return Response.json({ error: (e as Error).message }, { status: 400 });
    }

    const bodyBytes = body ? new TextEncoder().encode(body).length : 0;
    if (bodyBytes > PROXY_MAX_BODY_BYTES) {
        return Response.json({ error: 'Request body too large' }, { status: 413 });
    }

    const forwardHeaders = new Headers();
    Object.entries(headers).forEach(([key, value]) => {
        if (!FORWARD_HEADER_BLOCK.has(key.toLowerCase())) {
            forwardHeaders.set(key, value);
        }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    try {
        const upstream = await fetch(target.toString(), {
            method: method.toUpperCase(),
            headers: forwardHeaders,
            body: body && !['GET', 'HEAD'].includes(method.toUpperCase()) ? body : undefined,
            signal: controller.signal,
            redirect: 'follow',
        });

        const text = await upstream.text();
        const responseHeaders: Record<string, string> = {};
        upstream.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        return Response.json({
            status: upstream.status,
            statusText: upstream.statusText,
            headers: responseHeaders,
            body: text,
        });
    } catch (e) {
        const message = (e as Error).name === 'AbortError' ? 'Request timed out' : (e as Error).message;
        return Response.json({ error: message }, { status: 502 });
    } finally {
        clearTimeout(timeout);
    }
}
