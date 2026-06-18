/** Risk band and narrative types for the unified Brain risk widget. */

export type RiskBandId = "low" | "moderate" | "elevated" | "critical";

export interface RiskBand {
  id: RiskBandId;
  label: string;
}

export interface RiskTrendPoint {
  /** ISO date (week ending, UTC). */
  weekEnding: string;
  score: number;
}

export interface RiskNarrative {
  band: RiskBand;
  /** Recommended action when score crosses Brain thresholds. */
  thresholdAction: string | null;
  /** Human-readable deltas for the last 7 days. */
  weekChanges: readonly string[];
}
