// lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a singleton instance
let redis: Redis;
let otpRatelimit: Ratelimit;

export function getOtpRateLimiter(): Ratelimit {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Create a new ratelimiter with sliding window of 15 minutes that allows 5 requests
    otpRatelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "otp_ratelimit",
      analytics: true, // Optional: enables analytics
    });
  }

  return otpRatelimit;
}