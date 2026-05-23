export async function GET(request: Request) {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return Response.json({
        message: 'Post Office local echo',
        method: 'GET',
        path: url.pathname,
        query: params,
        timestamp: new Date().toISOString(),
    });
}

export async function POST(request: Request) {
    const url = new URL(request.url);
    let body: unknown = null;
    const contentType = request.headers.get('content-type') || '';
    try {
        if (contentType.includes('application/json')) {
            body = await request.json();
        } else {
            body = await request.text();
        }
    } catch {
        body = null;
    }

    return Response.json({
        message: 'Post Office local echo',
        method: 'POST',
        path: url.pathname,
        body,
        timestamp: new Date().toISOString(),
    });
}
