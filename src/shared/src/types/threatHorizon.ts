export type ThreatHorizonSeverity = "low" | "medium" | "high";

export interface ThreatHorizonItem {
  id: string;
  label: string;
  description: string;
  severity: ThreatHorizonSeverity;
  href?: string;
}
