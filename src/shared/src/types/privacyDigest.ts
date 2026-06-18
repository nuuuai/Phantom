import type { ExposureSeverity } from "./exposureReport.js";

export interface PrivacyDigest {
  generatedAt: string;
  periodLabel: string;
  headline: string;
  overallSeverity: ExposureSeverity;
  highlights: readonly string[];
  topActions: readonly string[];
  digestMode: boolean;
}
