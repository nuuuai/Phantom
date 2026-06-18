export interface VaultPasswordRotationCandidate {
  entryId: string;
  label: string;
  priorityRank: number;
  score: number;
  reason: string;
}

export interface VaultPasswordRotationInput {
  id: string;
  label: string;
  /** True when HIBP breach check flagged this password. */
  isBreached: boolean;
  breachCount: number;
  /** Number of vault entries sharing this password. */
  reuseCount: number;
}

/**
 * Ranks vault passwords for rotation priority (client-side only).
 * Higher score = rotate sooner. Never logs or transmits passwords.
 */
export function rankVaultPasswordsForRotation(
  inputs: readonly VaultPasswordRotationInput[],
  limit = 8
): VaultPasswordRotationCandidate[] {
  const scored = inputs.map((entry) => {
    let score = 10;
    if (entry.isBreached) score += 60 + Math.min(30, Math.floor(entry.breachCount / 1000));
    if (entry.reuseCount > 1) score += 15 + entry.reuseCount * 5;

    let reason = "Routine rotation — maintain vault hygiene.";
    if (entry.isBreached && entry.reuseCount > 1) {
      reason = `Breached password reused on ${entry.reuseCount} services — rotate first.`;
    } else if (entry.isBreached) {
      reason = `Found in ${entry.breachCount.toLocaleString()} known breaches — rotate immediately.`;
    } else if (entry.reuseCount > 1) {
      reason = `Password reused on ${entry.reuseCount} services — unique passwords reduce blast radius.`;
    }

    return { entry, score, reason };
  });

  return scored
    .filter((s) => s.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => ({
      entryId: item.entry.id,
      label: item.entry.label,
      priorityRank: index + 1,
      score: item.score,
      reason: item.reason,
    }));
}
