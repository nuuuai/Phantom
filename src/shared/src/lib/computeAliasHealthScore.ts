import type { HealthStatus } from "../types/alias.js";

const STATUS_BASE: Record<HealthStatus, number> = {
  healthy: 92,
  warning: 58,
  compromised: 22,
  quarantined: 15,
};

/** Computes 0–100 alias health score from status, spam, and recency signals. */
export function computeAliasHealthScore(input: {
  healthStatus: HealthStatus;
  spamCount: number;
  lastActivityAt: string | null;
}): number {
  let score = STATUS_BASE[input.healthStatus];
  score -= Math.min(30, input.spamCount * 3);

  if (!input.lastActivityAt) {
    score -= 8;
  } else {
    const daysSince =
      (Date.now() - new Date(input.lastActivityAt).getTime()) / 86_400_000;
    if (daysSince > 90) score -= 12;
    else if (daysSince > 30) score -= 5;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}
