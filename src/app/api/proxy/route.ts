import {
    assertProxyTargetAllowedAsync,
    clampProxyTimeoutMs,
    isProxyEnabled,
    PROXY_MAX_BODY_BYTES,
    PROXY_MAX_RESPONSE_BYTES,
} from '@/lib/proxyValidate';
import { enforceProxyRateLimit } from '@/lib/ratelimit';
import { buildNodeFormData, estimateMultipartSize, type ProxyMultipartPart } from '@/lib/multipart';
import { readResponseBodyWithLimit } from '@/lib/readResponseBody';

export const runtime = 'nodejs';

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
    bodyMode?: 'text' | 'multipart';
    multipart?: ProxyMultipartPart[];
    timeoutMs?: number;
}

function rateLimitResponse(reset: number) {
    return Response.json(
        { error: 'Too many requests' },
        {
            status: 429,
            headers: {
                'Retry-After': String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))),
            },
        },
    );
}

export async function POST(request: Request) {
    if (!isProxyEnabled()) {
        return Response.json({ error: 'Proxy is disabled' }, { status: 403 });
    }

    const rateLimit = await enforceProxyRateLimit(request);
    if (!rateLimit.success) {
        return rateLimitResponse(rateLimit.reset);
    }

    let payload: ProxyRequestBody;
    try {
        payload = (await request.json()) as ProxyRequestBody;
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { url, method = 'GET', headers = {}, body, bodyMode = 'text', multipart = [], timeoutMs } = payload;
    if (!url || typeof url !== 'string') {
        return Response.json({ error: 'url is required' }, { status: 400 });
    }

    let target: URL;
    try {
        target = await assertProxyTargetAllowedAsync(url);
    } catch (e) {
        return Response.json({ error: (e as Error).message }, { status: 400 });
    }

    const isMultipart = bodyMode === 'multipart';
    const bodyBytes = isMultipart ? estimateMultipartSize(multipart) : body ? new TextEncoder().encode(body).length : 0;
    if (bodyBytes > PROXY_MAX_BODY_BYTES) {
        return Response.json({ error: 'Request body too large' }, { status: 413 });
    }

    const forwardHeaders = new Headers();
    Object.entries(headers).forEach(([key, value]) => {
        const lower = key.toLowerCase();
        if (FORWARD_HEADER_BLOCK.has(lower)) return;
        if (isMultipart && lower === 'content-type') return;
        forwardHeaders.set(key, value);
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), clampProxyTimeoutMs(timeoutMs));

    try {
        let upstreamBody: BodyInit | undefined;
        if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
            if (isMultipart) {
                upstreamBody = buildNodeFormData(multipart);
            } else if (body) {
                upstreamBody = body;
            }
        }

        const upstream = await fetch(target.toString(), {
            method: method.toUpperCase(),
            headers: forwardHeaders,
            body: upstreamBody,
            signal: controller.signal,
            redirect: 'follow',
        });

        const text = await readResponseBodyWithLimit(upstream, PROXY_MAX_RESPONSE_BYTES);
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
        const status = message.includes('too large') ? 413 : 502;
        return Response.json({ error: message }, { status });
    } finally {
        clearTimeout(timeout);
    }
}
