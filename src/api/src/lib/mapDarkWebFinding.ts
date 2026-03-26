import type { DarkWebFinding } from "@prisma/client";
import type { DarkWebFindingPublic } from "@phantom/shared";

export function mapDarkWebFinding(row: DarkWebFinding): DarkWebFindingPublic {
  return {
    id: row.id,
    severity: row.severity,
    status: row.status,
    title: row.title,
    summary: row.summary,
    sourceLabel: row.sourceLabel,
    breachName: row.breachName,
    identifierType: row.identifierType,
    identifierDisplay: row.identifierDisplay,
    recommendedAction: row.recommendedAction,
    detectedAt: row.detectedAt.toISOString(),
    dismissedAt: row.dismissedAt?.toISOString() ?? null,
  };
}
