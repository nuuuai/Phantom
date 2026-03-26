import type { BrokerScanSummary } from "@phantom/shared";
import type { UserTier } from "@prisma/client";
import { resolveFreeTierBrokerScanCap } from "./brokerScanQuota.js";
import { isPaidTier } from "./userTierPaid.js";

const UNLIMITED_THRESHOLD = Number.MAX_SAFE_INTEGER / 2;

/**
 * Adds tier-derived fields to the numeric broker-scan summary (same values the
 * quota enforcer uses for `POST /broker-scan/start`).
 */
export function augmentBrokerScanSummary(
  user: { tier: UserTier } | null,
  base: Omit<BrokerScanSummary, "canRequestRemoval" | "freeTierBrokerScanMaxPer24h">
): BrokerScanSummary {
  const canRequestRemoval = user ? isPaidTier(user.tier) : false;
  const cap = resolveFreeTierBrokerScanCap();
  const freeTierBrokerScanMaxPer24h =
    user && !isPaidTier(user.tier)
      ? cap >= UNLIMITED_THRESHOLD
        ? null
        : cap
      : null;
  return { ...base, canRequestRemoval, freeTierBrokerScanMaxPer24h };
}
