export interface RiskScore {
  value: number;
  label: "low" | "moderate" | "elevated" | "critical";
  computedAt: string;
  factors: readonly string[];
}
