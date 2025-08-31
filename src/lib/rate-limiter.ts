// lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "redis";

// Create a Redis client that connects to our Docker container
const redisClient = createClient({
  // The URL uses the service name from docker-compose.yml as the hostname
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect the client
if (!redisClient.isOpen) {
    redisClient.connect();
}

// Create a wrapper for the Redis client to conform to the Ratelimit's expected Redis interface
const redis = {
  get: async (key: string) => {
    const value = await redisClient.get(key);
    return value;
  },
  set: async (key: string, value: string, opts?: { ex?: number }) => {
    if (opts?.ex) {
      return redisClient.set(key, value, { EX: opts.ex });
    }
    return redisClient.set(key, value);
  },
  incr: async (key: string) => {
    return redisClient.incr(key);
  },
  expire: async (key: string, ttl: number) => {
    return redisClient.expire(key, ttl);
  },
};

// Create the rate limiter using the wrapped Redis client
const ratelimit = new Ratelimit({
  redis: redisClient as any, // Cast to any to bypass type checking for Ratelimit's Redis interface
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
  prefix: "myapp_ratelimit",
});

export const getOtpRateLimiter = () => ratelimit;