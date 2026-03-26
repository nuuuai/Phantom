import { createHash, randomBytes } from "node:crypto";
import { getRedis } from "./redis.js";

/** Redis key: `phantom:refresh:<sha256(hex refresh token)>` → userId (opaque token is never stored). */
const PREFIX = "phantom:refresh:";
/** 7 days — sliding session length for refresh rotation. */
const TTL_SEC = 7 * 24 * 60 * 60;

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Persist a new refresh token; returns the opaque token string, or `null` if Redis is unavailable.
 */
export async function storeRefreshToken(userId: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const token = randomBytes(32).toString("hex");
  const key = PREFIX + hashRefreshToken(token);
  try {
    await redis.setex(key, TTL_SEC, userId);
  } catch {
    /** Fail closed: no opaque token issued if Redis write fails. */
    return null;
  }
  return token;
}

/** Returns userId if the refresh token exists; does not delete (use after new token stored). */
export async function getRefreshTokenUserId(
  token: string
): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const userId = await redis.get(PREFIX + hashRefreshToken(token));
  return userId;
}

export async function deleteRefreshToken(token: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(PREFIX + hashRefreshToken(token));
  } catch {
    /* best-effort revoke */
  }
}

/** Revoke without issuing a new access token (logout). */
export async function revokeRefreshToken(token: string): Promise<void> {
  await deleteRefreshToken(token);
}
