import { Redis } from '@upstash/redis';

export const STATS_KEYS = {
    jsonFormats: 'stats:json_formats',
    apiTests: 'stats:api_tests',
    siteVisits: 'stats:site_visits',
} as const;

type StatKey = (typeof STATS_KEYS)[keyof typeof STATS_KEYS];

let redisClient: Redis | null = null;

function requireEnv(name: 'UPSTASH_REDIS_REST_URL' | 'UPSTASH_REDIS_REST_TOKEN'): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function getRedisClient(): Redis {
    if (redisClient) return redisClient;

    redisClient = new Redis({
        url: requireEnv('UPSTASH_REDIS_REST_URL'),
        token: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
    });

    return redisClient;
}

export async function incrementStat(key: StatKey): Promise<number> {
    const redis = getRedisClient();
    return redis.incr(key);
}

export async function readStats(): Promise<{ jsonFormats: number; apiTests: number; siteVisits: number }> {
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
