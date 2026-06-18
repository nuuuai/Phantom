import type { HealthStatus } from "../types/alias.js";
import type { AliasRotationCandidate } from "../types/aliasRotation.js";

const STATUS_RANK: Record<HealthStatus, number> = {
  compromised: 0,
  quarantined: 1,
  warning: 2,
  healthy: 3,
};

export interface AliasRotationInput {
  aliasId: string;
  label: string;
  type: AliasRotationCandidate["type"];
  healthStatus: HealthStatus;
  healthScore: number;
  spamCount: number;
}

function rotationReason(input: AliasRotationInput): string {
  if (input.healthStatus === "compromised") {
    return "Critical — alias marked compromised; rotate immediately.";
  }
  if (input.healthStatus === "warning") {
    if (input.spamCount >= 5) {
      return `Warning state with ${input.spamCount} spam signal(s) — rotation recommended.`;
    }
    return "Warning state — monitor or rotate before exposure spreads.";
  }
  if (input.healthScore < 50) {
    return `Low health score (${input.healthScore}/100) — proactive rotation suggested.`;
  }
  if (input.spamCount >= 8) {
    return `High spam volume (${input.spamCount}) despite healthy status — consider rotation.`;
  }
  return "Preventive rotation — inbox velocity or age signals suggest refresh.";
}

/** Ranks rotatable aliases (non-password) by urgency — lower health score and worse status first. */
export function rankAliasesForRotation(
  inputs: readonly AliasRotationInput[],
  limit = 10
): AliasRotationCandidate[] {
  const eligible = inputs.filter((a) => a.type !== "password");

  const sorted = [...eligible].sort((a, b) => {
    const statusDiff =
      (STATUS_RANK[a.healthStatus] ?? 99) - (STATUS_RANK[b.healthStatus] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    if (a.healthScore !== b.healthScore) return a.healthScore - b.healthScore;
    return b.spamCount - a.spamCount;
  });

  const actionable = sorted.filter(
    (a) =>
      a.healthStatus === "compromised" ||
      a.healthStatus === "warning" ||
      a.healthScore < 65 ||
      a.spamCount >= 5
  );

  const ranked = (actionable.length > 0 ? actionable : sorted.slice(0, 3)).slice(
    0,
    limit
  );

  return ranked.map((item, index) => ({
    aliasId: item.aliasId,
    label: item.label,
    type: item.type,
    healthStatus: item.healthStatus,
    healthScore: item.healthScore,
    priorityRank: index + 1,
    reason: rotationReason(item),
  }));
}

export function formatRotationCandidatesReply(
  candidates: readonly AliasRotationCandidate[]
): string {
  if (candidates.length === 0) {
    return "All active aliases are healthy. No rotation needed unless you suspect a specific service leak. Password vault entries rotate from the Vault page.";
  }

  const lines = candidates.map(
    (c) =>
      `${c.priorityRank}. ${c.label} (${c.type}, ${c.healthStatus}, score ${c.healthScore}/100) — ${c.reason}`
  );

  return `Rotation priority (health-ranked):\n\n${lines.join("\n\n")}\n\nConfirm a rotate action below to quarantine and replace an alias. Password vault entries must be rotated from Vault.`;
}
