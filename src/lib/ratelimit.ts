import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { isRedisConfigured } from '@/lib/redis';

interface LimitResult {
    success: boolean;
    reset: number;
}

let redisForLimit: Redis | null = null;

export function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const first = forwardedFor.split(',')[0]?.trim();
        if (first) return first;
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;

    return 'unknown';
}

function getRedisClient(): Redis {
    if (redisForLimit) return redisForLimit;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        throw new Error('Rate limiting requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
    }

    redisForLimit = new Redis({ url, token });
    return redisForLimit;
}

function shouldSkipRateLimit(): boolean {
    return process.env.UPSTASH_RATE_LIMIT_ENABLED === 'false' || !isRedisConfigured();
}

const jsonFormatterLimiter = () =>
    new Ratelimit({
        redis: getRedisClient(),
        limiter: Ratelimit.slidingWindow(20, '60 s'),
        analytics: true,
        prefix: 'ratelimit:track:json',
    });

const apiTesterLimiter = () =>
    new Ratelimit({
        redis: getRedisClient(),
        limiter: Ratelimit.slidingWindow(30, '60 s'),
        analytics: true,
        prefix: 'ratelimit:track:api',
    });

const siteVisitLimiter = () =>
    new Ratelimit({
        redis: getRedisClient(),
        limiter: Ratelimit.slidingWindow(5, '60 s'),
        analytics: true,
        prefix: 'ratelimit:track:visit',
    });

const proxyLimiter = () =>
    new Ratelimit({
        redis: getRedisClient(),
        limiter: Ratelimit.slidingWindow(15, '60 s'),
        analytics: true,
        prefix: 'ratelimit:proxy',
    });

export async function enforceTrackRateLimit(type: 'json' | 'api' | 'visit', request: Request): Promise<LimitResult> {
    if (shouldSkipRateLimit()) {
        return { success: true, reset: 0 };
    }

    const ip = getClientIp(request);
    const limiter =
        type === 'json' ? jsonFormatterLimiter() : type === 'api' ? apiTesterLimiter() : siteVisitLimiter();

    const result = await limiter.limit(ip);
    return {
        success: result.success,
        reset: result.reset,
    };
}

export async function enforceProxyRateLimit(request: Request): Promise<LimitResult> {
    if (shouldSkipRateLimit()) {
        return { success: true, reset: 0 };
    }

    const ip = getClientIp(request);
    const result = await proxyLimiter().limit(ip);
    return {
        success: result.success,
        reset: result.reset,
    };
}
