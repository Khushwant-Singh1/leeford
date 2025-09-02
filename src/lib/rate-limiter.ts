// lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "redis";

// Create a Redis client for local Redis Stack
let redis: ReturnType<typeof createClient> | null = null;
let ratelimit: Ratelimit | null = null;

// Create an adapter to make the standard Redis client compatible with Upstash
function createRedisAdapter(client: ReturnType<typeof createClient>) {
  return {
    get: async (key: string) => {
      try {
        return await client.get(key);
      } catch (error) {
        console.warn('Redis get error:', error);
        return null;
      }
    },
    set: async (key: string, value: string, options?: { ex?: number; px?: number }) => {
      try {
        if (options?.ex) {
          await client.setEx(key, options.ex, value);
        } else if (options?.px) {
          await client.pSetEx(key, options.px, value);
        } else {
          await client.set(key, value);
        }
        return 'OK';
      } catch (error) {
        console.warn('Redis set error:', error);
        throw error;
      }
    },
    eval: async (script: string, keys: string[], args: string[]) => {
      try {
        return await client.eval(script, {
          keys,
          arguments: args.map(arg => String(arg)), // Convert all args to strings
        });
      } catch (error) {
        console.warn('Redis eval error:', error);
        throw error;
      }
    },
    evalsha: async (sha: string, keys: string[], args: string[]) => {
      try {
        return await client.evalSha(sha, {
          keys,
          arguments: args.map(arg => String(arg)), // Convert all args to strings
        });
      } catch (error) {
        console.warn('Redis evalsha error:', error);
        throw error;
      }
    },
    script: {
      load: async (script: string) => {
        try {
          return await client.scriptLoad(script);
        } catch (error) {
          console.warn('Redis script load error:', error);
          throw error;
        }
      }
    }
  };
}

// Only initialize Redis if we're not in build mode and Redis URL is available
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('Redis connection failed after 3 retries');
            return false; // Stop retrying
          }
          return Math.min(retries * 50, 500);
        }
      }
    });

    redis.on('error', (err) => {
      console.warn('Redis client error:', err);
    });

    redis.on('connect', () => {
      console.log('Connected to Redis Stack');
    });

    // Connect to Redis
    redis.connect().then(() => {
      console.log('Redis Stack connection established');
      
      // Create the rate limiter with the Redis adapter
      const redisAdapter = createRedisAdapter(redis!);
      ratelimit = new Ratelimit({
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
        prefix: "myapp_ratelimit",
      });
    }).catch((err) => {
      console.warn('Redis connection failed:', err);
      redis = null;
      ratelimit = null;
    });

  } catch (error) {
    console.warn('Redis setup failed, rate limiting will be disabled:', error);
    redis = null;
    ratelimit = null;
  }
}

export const getOtpRateLimiter = () => ratelimit;