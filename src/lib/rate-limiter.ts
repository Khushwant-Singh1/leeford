// lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import Redis from "ioredis";

// Create a new ioredis client only if not in build time
// During build time, Redis might not be available
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

// Only initialize Redis if we're not in build mode and Redis URL is available
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      connectTimeout: 5000,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    // Create the rate limiter and pass the ioredis client directly.
    ratelimit = new Ratelimit({
      redis: redis as any,
      limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
      prefix: "myapp_ratelimit",
    });
  } catch (error) {
    console.warn('Redis connection failed, rate limiting will be disabled:', error);
    redis = null;
    ratelimit = null;
  }
}

export const getOtpRateLimiter = () => ratelimit;