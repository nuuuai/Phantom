export interface ThreatPattern {
  id: string;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  observedAt: string;
  expiresAt: string;
  anonymizedFingerprint: string;
}
