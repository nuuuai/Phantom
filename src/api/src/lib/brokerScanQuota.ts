import type { PrismaClient, UserTier } from "@prisma/client";
import { FREE_TIER_BROKER_SCAN_MAX_PER_24H } from "@phantom/shared";
import { prisma } from "./prisma.js";

type ScanQuotaDb = Pick<PrismaClient, "brokerScanRun">;

/** Rolling window for free-tier scan frequency (ms). */
export const FREE_TIER_BROKER_SCAN_WINDOW_MS = 24 * 60 * 60 * 1000;

const DEFAULT_FREE_BROKER_SCAN_CAP: number =
  typeof FREE_TIER_BROKER_SCAN_MAX_PER_24H === "number"
    ? FREE_TIER_BROKER_SCAN_MAX_PER_24H
    : 3;

/**
 * Effective cap for free tier. Override with `FREE_TIER_BROKER_SCAN_MAX_PER_24H`
 * (integer). Use `0` or `unlimited` to disable the cap (dev/staging only).
 */
export function resolveFreeTierBrokerScanCap(): number {
  const raw = process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H?.trim();
  if (!raw) return DEFAULT_FREE_BROKER_SCAN_CAP;
  if (raw.toLowerCase() === "unlimited") return Number.MAX_SAFE_INTEGER;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return DEFAULT_FREE_BROKER_SCAN_CAP;
  if (n <= 0) return Number.MAX_SAFE_INTEGER;
  return Math.min(n, 500);
}

export async function assertCanStartBrokerScan(
  userId: string,
  tier: UserTier,
  db: ScanQuotaDb = prisma
): Promise<
  | { ok: true }
  | {
      ok: false;
      code: "scan_rate_limited";
      message: string;
      retryAfterSeconds: number;
    }
> {
  if (tier !== "free") return { ok: true };

  const cap = resolveFreeTierBrokerScanCap();
  if (cap >= Number.MAX_SAFE_INTEGER / 2) return { ok: true };

  const since = new Date(Date.now() - FREE_TIER_BROKER_SCAN_WINDOW_MS);
  const count = await db.brokerScanRun.count({
    where: { userId, startedAt: { gte: since } },
  });

  if (count < cap) return { ok: true };

  const oldest = await db.brokerScanRun.findFirst({
    where: { userId, startedAt: { gte: since } },
    orderBy: { startedAt: "asc" },
    select: { startedAt: true },
  });
  const retryAfterMs = oldest
    ? Math.max(
        0,
        oldest.startedAt.getTime() + FREE_TIER_BROKER_SCAN_WINDOW_MS - Date.now(),
      )
    : 0;

  return {
    ok: false,
    code: "scan_rate_limited",
    message: `Free tier allows ${String(cap)} exposure scan${cap === 1 ? "" : "s"} per 24 hours. Upgrade to Phantom Pro for unlimited scans.`,
    retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
  };
}
