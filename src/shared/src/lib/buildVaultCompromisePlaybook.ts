import type { VaultPlaybookStep } from "../types/vaultCompromisePlaybook.js";

export interface VaultCompromisePlaybookInput {
  breachedEntryCount: number;
  reuseGroupCount: number;
  topRotationLabels: readonly string[];
}

/** Ordered remediation steps after vault audit — no passwords in output. */
export function buildVaultCompromisePlaybook(
  input: VaultCompromisePlaybookInput
): readonly VaultPlaybookStep[] {
  if (input.breachedEntryCount === 0 && input.reuseGroupCount === 0) {
    return [];
  }

  const steps: VaultPlaybookStep[] = [];

  if (input.breachedEntryCount > 0) {
    steps.push({
      id: "rotate_breached",
      title: "Rotate breached passwords first",
      description:
        input.topRotationLabels.length > 0
          ? `Start with ${input.topRotationLabels.slice(0, 3).join(", ")} — these matched known breach corpora.`
          : "Rotate every entry flagged in the breach check before reusing passwords elsewhere.",
      priority: 1,
    });
  }

  if (input.reuseGroupCount > 0) {
    steps.push({
      id: "break_reuse",
      title: "Break password reuse clusters",
      description: `${input.reuseGroupCount} reuse group(s) detected — assign unique passwords per service.`,
      priority: 2,
    });
  }

  steps.push({
    id: "enable_autopilot",
    title: "Enable Autopilot rotation prefs",
    description:
      "Turn on auto-rotate and inbox quarantine in Settings so Phantom reacts before the next breach wave.",
    priority: 3,
  });

  steps.push({
    id: "review_aliases",
    title: "Review linked aliases",
    description:
      "Check email and username aliases tied to rotated vault entries for forwarding or phishing spikes.",
    priority: 4,
  });

  return steps.sort((a, b) => a.priority - b.priority);
}
