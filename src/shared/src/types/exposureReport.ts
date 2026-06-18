export type ExposureSeverity = "low" | "medium" | "high" | "critical";

export interface ExposureReportSection {
  id: string;
  title: string;
  summary: string;
  severity: ExposureSeverity;
  actionItems: readonly string[];
}

export interface ExposureReport {
  id: string;
  generatedAt: string;
  periodLabel: string;
  overallSeverity: ExposureSeverity;
  narrative: string;
  sections: readonly ExposureReportSection[];
}
