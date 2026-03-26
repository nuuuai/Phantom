import { Redis } from "ioredis";

let client: Redis | null | undefined;

/**
 * Returns a shared Redis client when `REDIS_URL` is set; otherwise `null`.
 *
 * **Key semantics (Phase 1):**
 * - Refresh tokens: `phantom:refresh:<sha256(token)>` → `userId`, TTL **7 days** — see `refreshTokens.ts`.
 * - Global HTTP rate limit (when Redis-backed): keys are owned by `rate-limit-redis` / express-rate-limit
 *   (prefix not fixed in our code). See `DEPLOYMENT.md`.
 */
export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url || url.length === 0) {
    return null;
  }
  if (client === undefined) {
    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return client;
}

export async function pingRedis(): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    const pong = await r.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
