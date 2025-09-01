// lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import Redis from "ioredis";

// Create a new ioredis client.
// It will automatically connect to the URL provided in the environment variables.
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Create the rate limiter and pass the ioredis client directly.
// No wrappers or 'as any' casting is needed.
const ratelimit = new Ratelimit({
  redis: redis as any,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
  prefix: "myapp_ratelimit",
  // You can add analytics if needed, but it requires an Upstash account.
  // analytics: true, 
});

export const getOtpRateLimiter = () => ratelimit;