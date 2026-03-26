import { Redis } from "ioredis";

let client: Redis | null | undefined;

/**
 * Returns a shared Redis client when `REDIS_URL` is set; otherwise `null`.
 * Used for refresh token sessions and future cache features.
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
