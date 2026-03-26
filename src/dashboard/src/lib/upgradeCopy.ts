/**
 * Single source for upgrade / conversion copy (dashboard). Keep honest about Phase 1 simulation.
 */

import { PHANTOM_API_ERROR_CODES } from "@phantom/shared";

export type UpgradeReason =
  | "scan_rate_limited"
  | "removal_queue"
  | "alias_cap"
  | "broker_exposure"
  | "dark_web"
  | "generic";

export type UpgradeContext = {
  exposureCount?: number;
  /** Seconds until retry (e.g. broker scan 429). */
  retryAfterSeconds?: number;
  tierLimit?: { aliasType: string; used: number; max: number };
};

const SIM_FOOTNOTE =
  "Phase 1: automated removal queue is simulated — DIY opt-out links work on all tiers.";

export function apiErrorCodeToUpgradeReason(code: string): UpgradeReason | null {
  switch (code) {
    case PHANTOM_API_ERROR_CODES.scan_rate_limited:
      return "scan_rate_limited";
    case PHANTOM_API_ERROR_CODES.upgrade_required:
      return "removal_queue";
    case PHANTOM_API_ERROR_CODES.tier_limit:
      return "alias_cap";
    default:
      return null;
  }
}

function scanBody(ctx: UpgradeContext): string {
  const r = ctx.retryAfterSeconds;
  const retryHint =
    typeof r === "number" && r > 0
      ? ` You can retry in about ${String(Math.max(1, Math.ceil(r / 60)))} minute(s), or upgrade for unlimited scans.`
      : " Upgrade to Phantom Pro for unlimited full scans per rolling 24 hours.";
  return `Free tier includes a limited number of full broker scans per rolling 24 hours.${retryHint}`;
}

function removalBody(_ctx: UpgradeContext): string {
  return "Phantom Pro adds a removal request queue on top of DIY opt-out links. The queue is simulated in Phase 1 — you still get real self-service links on the free tier.";
}

function aliasBody(ctx: UpgradeContext): string {
  const t = ctx.tierLimit;
  if (t) {
    return `You are using ${String(t.used)} of ${String(t.max)} ${t.aliasType} aliases on the free tier. Upgrade for unlimited aliases, or remove an existing alias.`;
  }
  return "You have reached the free-tier limit for this alias type. Upgrade to Phantom Pro for unlimited aliases, or remove an existing alias.";
}

function brokerExposureBody(ctx: UpgradeContext): string {
  const n = ctx.exposureCount ?? 0;
  return `Your data appeared on ${String(n)} broker result(s). Pro unlocks the removal queue (simulated in Phase 1) plus unlimited scans; DIY links remain available on all tiers.`;
}

function genericBody(_ctx: UpgradeContext): string {
  return "Upgrade to Phantom Pro for unlimited aliases, unlimited broker scans, and the removal queue (simulated in Phase 1).";
}

function darkWebBody(_ctx: UpgradeContext): string {
  return "Phantom Pro includes basic dark web exposure checks (public breach datasets via Have I Been Pwned when configured). This is not 24/7 marketplace monitoring — see DEPLOYMENT.md for what is actually wired.";
}

export function upgradeTitle(reason: UpgradeReason): string {
  switch (reason) {
    case "scan_rate_limited":
      return "Scan limit — upgrade for unlimited scans";
    case "removal_queue":
      return "Upgrade for Pro removal queue";
    case "alias_cap":
      return "Alias limit reached";
    case "broker_exposure":
      return "Upgrade to Phantom Pro";
    case "dark_web":
      return "Dark web checks — Phantom Pro";
    default:
      return "Upgrade to Phantom Pro";
  }
}

export function upgradeBody(reason: UpgradeReason, ctx: UpgradeContext = {}): string {
  switch (reason) {
    case "scan_rate_limited":
      return scanBody(ctx);
    case "removal_queue":
      return removalBody(ctx);
    case "alias_cap":
      return aliasBody(ctx);
    case "broker_exposure":
      return brokerExposureBody(ctx);
    case "dark_web":
      return darkWebBody(ctx);
    default:
      return genericBody(ctx);
  }
}

export function upgradeFootnote(_reason: UpgradeReason): string {
  return SIM_FOOTNOTE;
}
