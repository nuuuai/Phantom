import { RISK_THRESHOLDS } from "../constants/riskThresholds.js";
import type { RiskBand, RiskNarrative } from "../types/riskNarrative.js";
import type { DashboardIntelligenceContext } from "./buildDashboardIntelligence.js";

export function buildRiskBand(score: number): RiskBand {
  if (score <= RISK_THRESHOLDS.LOW_MAX) {
    return { id: "low", label: "Low" };
  }
  if (score <= RISK_THRESHOLDS.MODERATE_MAX) {
    return { id: "moderate", label: "Moderate" };
  }
  if (score <= RISK_THRESHOLDS.ELEVATED_MAX) {
    return { id: "elevated", label: "Elevated" };
  }
  return { id: "critical", label: "Critical" };
}

export function buildRiskThresholdAction(
  score: number,
  ctx: DashboardIntelligenceContext
): string | null {
  if (score <= RISK_THRESHOLDS.MODERATE_MAX) return null;

  if (score > RISK_THRESHOLDS.ELEVATED_MAX) {
    if (ctx.aliasesCompromised > 0) {
      return "Critical risk — rotate compromised aliases immediately and re-scan brokers.";
    }
    if (ctx.darkWebAlerts > 0) {
      return "Critical risk — review dark web findings and rotate affected credentials.";
    }
    return "Critical risk — run a broker scan and address top priority actions today.";
  }

  if (ctx.brokersPending > 0 || ctx.brokersRelisted > 0) {
    return "Elevated risk — confirm broker removals and watch for re-listings.";
  }
  if (!ctx.hasBrokerScan) {
    return "Elevated risk — run your first broker scan to map exposure.";
  }
  if (ctx.aliasesWarning > 0) {
    return "Elevated risk — monitor warning-state aliases for spam or breach signals.";
  }
  return "Elevated risk — review priority actions and inbox for phishing.";
}

export function buildRiskNarrative(
  ctx: DashboardIntelligenceContext,
  weekChanges: readonly string[]
): RiskNarrative {
  const band = buildRiskBand(ctx.riskScore);
  return {
    band,
    thresholdAction: buildRiskThresholdAction(ctx.riskScore, ctx),
    weekChanges,
  };
}

/** Demo / fallback series when insufficient history exists. */
export function buildSyntheticRiskTrendSeries(
  currentScore: number,
  trendDelta: number
): { score: number; weekEnding: string }[] {
  const now = Date.now();
  const points: { score: number; weekEnding: string }[] = [];
  const startScore = Math.max(
    12,
    Math.min(92, currentScore - trendDelta * 13)
  );

  for (let w = 12; w >= 0; w--) {
    const weekEnd = new Date(now - w * 7 * 86_400_000);
    const t = (12 - w) / 12;
    const score = Math.round(startScore + (currentScore - startScore) * t);
    points.push({
      weekEnding: weekEnd.toISOString().slice(0, 10),
      score: Math.max(12, Math.min(92, score)),
    });
  }
  points[points.length - 1]!.score = currentScore;
  return points;
}

export function riskTrendFromSeries(
  series: readonly { score: number }[]
): number {
  if (series.length < 2) return 0;
  return series[series.length - 1]!.score - series[series.length - 2]!.score;
}
