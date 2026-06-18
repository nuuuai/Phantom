import type { DarkWebFindingPublic } from "../types/darkWebFinding.js";
import type { BreachTimelinePoint } from "../types/breachTimeline.js";
import { hashUserSeed } from "./hashUserSeed.js";

const SEVERITY_LAG_DAYS: Record<DarkWebFindingPublic["severity"], number> = {
  critical: 120,
  high: 90,
  medium: 45,
  low: 21,
};

/** Estimates exposure vs detection lag from finding metadata (no PII). */
export function buildBreachTimeline(
  finding: Pick<DarkWebFindingPublic, "id" | "detectedAt" | "severity">
): BreachTimelinePoint {
  const detected = new Date(finding.detectedAt);
  const seed = hashUserSeed(`${finding.id}:breach-lag`);
  const jitter = seed % 30;
  const lagDays = SEVERITY_LAG_DAYS[finding.severity] + jitter;
  const exposed = new Date(detected.getTime() - lagDays * 86_400_000);

  return {
    findingId: finding.id,
    detectedAt: finding.detectedAt,
    estimatedExposedAt: exposed.toISOString(),
    lagDays,
  };
}
