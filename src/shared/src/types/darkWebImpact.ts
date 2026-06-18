import type { DarkWebSeverity } from "./darkWebFinding.js";

export interface DarkWebImpactLink {
  type: "account_email" | "alias_email" | "password_risk" | "alias_health";
  label: string;
  detail: string;
  href?: string;
}

export interface DarkWebImpactAnalysis {
  findingId: string;
  severity: DarkWebSeverity;
  impactScore: number;
  headline: string;
  links: readonly DarkWebImpactLink[];
  remediationSteps: readonly string[];
}

export interface DarkWebImpactSummary {
  items: readonly DarkWebImpactAnalysis[];
  tierGated: boolean;
}
