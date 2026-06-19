export const runtime = 'nodejs';

const ECHO_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

async function readRequestBody(request: Request): Promise<unknown> {
    const contentType = request.headers.get('content-type') || '';
    try {
        if (contentType.includes('application/json')) {
            return await request.json();
        }
        const text = await request.text();
        return text.length ? text : null;
    } catch {
        return null;
    }
}

async function handleEcho(request: Request) {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                Allow: ECHO_METHODS.join(', '),
            },
        });
    }

    const body = ['GET', 'HEAD'].includes(method) ? null : await readRequestBody(request);

    const payload = {
        message: 'Post Office local echo',
        method,
        path: url.pathname,
        query: params,
        body,
        timestamp: new Date().toISOString(),
    };

    if (method === 'HEAD') {
        return new Response(null, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Echo-Method': method,
            },
        });
    }

    return Response.json(payload);
}

export async function GET(request: Request) {
    return handleEcho(request);
}

export async function POST(request: Request) {
    return handleEcho(request);
}

export async function PUT(request: Request) {
    return handleEcho(request);
}

export async function PATCH(request: Request) {
    return handleEcho(request);
}

export async function DELETE(request: Request) {
    return handleEcho(request);
}

export async function HEAD(request: Request) {
    return handleEcho(request);
}

export async function OPTIONS(request: Request) {
    return handleEcho(request);
}
