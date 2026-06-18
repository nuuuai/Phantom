import type { ExposureReport } from "../types/exposureReport.js";
import type { PrivacyDigest } from "../types/privacyDigest.js";
import type { PriorityAction } from "../types/dashboardIntelligence.js";

export interface PrivacyDigestInput {
  report: ExposureReport;
  priorityActions: readonly PriorityAction[];
  digestMode: boolean;
}

/** Condensed daily digest from exposure report + priority actions — no PII. */
export function buildPrivacyDigest(input: PrivacyDigestInput): PrivacyDigest {
  const criticalSections = input.report.sections.filter(
    (s) => s.severity === "critical" || s.severity === "high"
  );

  const highlights = [
    input.report.narrative,
    ...criticalSections.map((s) => `${s.title}: ${s.summary}`),
  ].slice(0, 4);

  const sectionActions = input.report.sections.flatMap((s) => s.actionItems);
  const priorityLabels = input.priorityActions.map((a) => a.title);
  const topActions = [...new Set([...priorityLabels, ...sectionActions])].slice(
    0,
    5
  );

  const headline =
    input.report.overallSeverity === "critical" ||
    input.report.overallSeverity === "high"
      ? "Action needed — elevated privacy exposure detected"
      : input.report.overallSeverity === "medium"
        ? "Moderate exposure — review recommended actions"
        : "Privacy posture stable — maintain monitoring";

  return {
    generatedAt: input.report.generatedAt,
    periodLabel: input.report.periodLabel,
    headline,
    overallSeverity: input.report.overallSeverity,
    highlights,
    topActions,
    digestMode: input.digestMode,
  };
}
