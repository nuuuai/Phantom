export type ExposureSeverityBand = "low" | "medium" | "high" | "critical";

/** Maps 0–100 exposure severity score to a human-readable band. */
export function exposureSeverityBand(score: number): ExposureSeverityBand {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export function exposureSeverityBandLabel(band: ExposureSeverityBand): string {
  if (band === "critical") return "Critical";
  if (band === "high") return "High";
  if (band === "medium") return "Medium";
  return "Low";
}
