import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedis } from "./redis.js";

/**
 * Global API rate limiter: Redis-backed when `REDIS_URL` is set (survives multi-instance),
 * otherwise in-memory (dev / single node).
 */
export function createGlobalRateLimiter() {
  const redis = getRedis();
  if (redis) {
    return rateLimit({
      windowMs: 60_000,
      max: 10_000,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        // ioredis `call` return type is wider than rate-limit-redis' RedisReply; runtime is compatible.
        sendCommand: ((...args: string[]) => {
          if (args.length === 0) {
            return Promise.reject(new Error("empty redis command"));
          }
          const cmd = args[0]!;
          return redis.call(cmd, ...args.slice(1));
        }) as (...args: string[]) => ReturnType<
          RedisStore["sendCommand"]
        >,
      }),
    });
  }
  return rateLimit({
    windowMs: 60_000,
    max: 10_000,
    standardHeaders: true,
    legacyHeaders: false,
  });
}
