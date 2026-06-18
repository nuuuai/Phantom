import type { CallGuardCallLog, CallGuardSummary } from "../types/callGuard.js";
import { createSeededRandom, hashUserSeed } from "./hashUserSeed.js";

const CALLER_LABELS = [
  "Unknown caller",
  "FedEx delivery",
  "Bank security",
  "Medicare services",
  "Vehicle warranty",
  "IRS collections",
  "Amazon support",
] as const;

function isoDaysAgo(days: number, hour: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

/**
 * Deterministic Call Guard demo logs derived from user id hash.
 * No real phone numbers — caller fingerprints are synthetic hashes only.
 */
export function generateCallGuardDemo(
  userId: string,
  demoMode: boolean
): CallGuardSummary {
  if (!demoMode) {
    return {
      totalScreened: 0,
      scamsBlocked: 0,
      scamsEngaged: 0,
      avgScamConfidence: 0,
      recentLogs: [],
      demoMode: false,
    };
  }

  const rand = createSeededRandom(hashUserSeed(userId));
  const logCount = 6 + Math.floor(rand() * 4);
  const logs: CallGuardCallLog[] = [];

  for (let i = 0; i < logCount; i++) {
    const scamConfidence = Math.round(rand() * 100);
    let decision: CallGuardCallLog["decision"] = "pass";
    if (scamConfidence >= 80) decision = rand() > 0.4 ? "engage" : "block";
    else if (scamConfidence >= 50) decision = "screen";
    else decision = "pass";

    const labelIdx = Math.floor(rand() * CALLER_LABELS.length);
    const hashSuffix = Math.floor(rand() * 0xffffff)
      .toString(16)
      .padStart(6, "0");

    logs.push({
      id: `cg-demo-${i + 1}`,
      callerNumberHash: `anon-${hashSuffix}`,
      callerLabel: CALLER_LABELS[labelIdx] ?? "Unknown caller",
      scamConfidence,
      decision,
      durationSec: Math.round(15 + rand() * 420),
      transcriptPreview:
        decision === "engage" || decision === "screen"
          ? "Automated screening transcript preview (demo)."
          : null,
      occurredAt: isoDaysAgo(i, 9 + (i % 8)),
    });
  }

  logs.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  const scamsBlocked = logs.filter((l) => l.decision === "block").length;
  const scamsEngaged = logs.filter((l) => l.decision === "engage").length;
  const avgScamConfidence =
    logs.length > 0
      ? Math.round(
          logs.reduce((s, l) => s + l.scamConfidence, 0) / logs.length
        )
      : 0;

  const multiplier = 80 + Math.floor(rand() * 40);

  return {
    totalScreened: logCount * multiplier,
    scamsBlocked: scamsBlocked * multiplier,
    scamsEngaged: scamsEngaged * multiplier,
    avgScamConfidence,
    recentLogs: logs,
    demoMode: true,
  };
}

export function generateCallGuardDemoLogs(userId: string): CallGuardCallLog[] {
  return [...generateCallGuardDemo(userId, true).recentLogs];
}
