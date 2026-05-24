import { incrementStat, STATS_KEYS } from '@/lib/redis';
import { enforceTrackRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const rateLimit = await enforceTrackRateLimit('visit', request);
        if (!rateLimit.success) {
            return Response.json(
                { ok: false, error: 'Too many requests' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))),
                    },
                },
            );
        }

        const value = await incrementStat(STATS_KEYS.siteVisits);
        return Response.json({ ok: true, count: value });
    } catch (error) {
        console.error('visit tracking error', error);
        return Response.json({ ok: false, error: 'Failed to track site visit event' }, { status: 500 });
    }
}
