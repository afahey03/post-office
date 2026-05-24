import { readStats } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stats = await readStats();

        return Response.json(
            {
                ok: true,
                stats,
            },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                },
            },
        );
    } catch (error) {
        console.error('stats read error', error);
        return Response.json(
            {
                ok: false,
                stats: {
                    jsonFormats: 0,
                    apiTests: 0,
                    siteVisits: 0,
                },
                error: 'Failed to load stats',
            },
            { status: 500 },
        );
    }
}
