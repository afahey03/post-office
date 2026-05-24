import { incrementStat, STATS_KEYS } from '@/lib/redis';
import { enforceTrackRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const rateLimit = await enforceTrackRateLimit('json', request);
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

        const value = await incrementStat(STATS_KEYS.jsonFormats);
        return Response.json({ ok: true, count: value });
    } catch (error) {
        console.error('json-format tracking error', error);
        return Response.json({ ok: false, error: 'Failed to track JSON format event' }, { status: 500 });
    }
}
