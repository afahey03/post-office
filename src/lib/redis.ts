import { Redis } from '@upstash/redis';

export const STATS_KEYS = {
    jsonFormats: 'stats:json_formats',
    apiTests: 'stats:api_tests',
    siteVisits: 'stats:site_visits',
} as const;

type StatKey = (typeof STATS_KEYS)[keyof typeof STATS_KEYS];

let redisClient: Redis | null = null;

export function isRedisConfigured(): boolean {
    return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedisClient(): Redis {
    if (redisClient) return redisClient;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        throw new Error('Redis is not configured');
    }

    redisClient = new Redis({ url, token });
    return redisClient;
}

/** Returns the new counter value, or null when Redis is not configured. */
export async function incrementStat(key: StatKey): Promise<number | null> {
    if (!isRedisConfigured()) return null;

    const redis = getRedisClient();
    return redis.incr(key);
}

export async function readStats(): Promise<{ jsonFormats: number; apiTests: number; siteVisits: number }> {
    if (!isRedisConfigured()) {
        return { jsonFormats: 0, apiTests: 0, siteVisits: 0 };
    }

    const redis = getRedisClient();

    const [jsonFormats, apiTests, siteVisits] = await Promise.all([
        redis.get<number>(STATS_KEYS.jsonFormats),
        redis.get<number>(STATS_KEYS.apiTests),
        redis.get<number>(STATS_KEYS.siteVisits),
    ]);

    return {
        jsonFormats: Number(jsonFormats ?? 0),
        apiTests: Number(apiTests ?? 0),
        siteVisits: Number(siteVisits ?? 0),
    };
}
