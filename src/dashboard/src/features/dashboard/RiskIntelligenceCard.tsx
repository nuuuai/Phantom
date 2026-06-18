import type { RiskFactor, RiskNarrative, RiskTrendPoint } from "@phantom/shared";
import { RISK_THRESHOLDS } from "@phantom/shared";
import { motion } from "framer-motion";
import { useState } from "react";
import { RiskTrendChart } from "./RiskTrendChart.js";

interface RiskIntelligenceCardProps {
  riskScore: number;
  riskTrend: number;
  factors: readonly RiskFactor[];
  trendSeries: readonly RiskTrendPoint[];
  narrative: RiskNarrative;
}

function riskScoreColor(score: number): string {
  if (score <= RISK_THRESHOLDS.LOW_MAX) return "text-ph-success";
  if (score <= RISK_THRESHOLDS.MODERATE_MAX) return "text-ph-info";
  if (score <= RISK_THRESHOLDS.ELEVATED_MAX) return "text-ph-warning";
  return "text-ph-danger";
}

function bandStyles(bandId: RiskNarrative["band"]["id"]): {
  text: string;
  bg: string;
  border: string;
} {
  switch (bandId) {
    case "low":
      return { text: "#34D399", bg: "#0d2818", border: "#134e2a" };
    case "moderate":
      return { text: "#60A5FA", bg: "#1a2332", border: "#1e3a5f" };
    case "elevated":
      return { text: "#FBBF24", bg: "#2a2208", border: "#5c4a12" };
    case "critical":
      return { text: "#F87171", bg: "#2a0f0f", border: "#5c1a1a" };
  }
}

function factorBarColor(score: number): string {
  if (score <= 30) return "bg-ph-success";
  if (score <= 60) return "bg-ph-warning";
  return "bg-ph-danger";
}

export function RiskIntelligenceCard({
  riskScore,
  riskTrend,
  factors,
  trendSeries,
  narrative,
}: RiskIntelligenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const scoreClass = riskScoreColor(riskScore);
  const bandStyle = bandStyles(narrative.band.id);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="mb-5 rounded-xl border border-ph-border bg-ph-surface p-5"
      aria-label="Risk intelligence"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-mono text-xs font-semibold uppercase tracking-wide text-ph-text-tertiary">
            Risk intelligence
          </div>
          <span
            className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
            style={{
              color: bandStyle.text,
              backgroundColor: bandStyle.bg,
              borderColor: bandStyle.border,
            }}
          >
            {narrative.band.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded border border-ph-border bg-ph-raised px-2 py-0.5 font-sans text-[11px] text-ph-text-secondary hover:text-ph-text-primary"
          aria-expanded={expanded}
        >
          {expanded ? "Hide factors" : "Why?"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_200px]">
        <div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span
              className={`text-[28px] font-light tracking-[-0.02em] ${scoreClass}`}
            >
              {riskScore}
            </span>
            <span className="font-sans text-sm text-ph-text-muted">/ 100</span>
            {riskTrend !== 0 ? (
              <span
                className={`font-sans text-[13px] font-medium ${riskTrend < 0 ? "text-ph-success" : "text-ph-danger"}`}
              >
                {riskTrend < 0 ? "↓" : "↑"}
                {Math.abs(riskTrend)} vs last week
              </span>
            ) : (
              <span className="font-sans text-[13px] text-ph-text-muted">
                Stable vs last week
              </span>
            )}
          </div>

          {narrative.thresholdAction ? (
            <p
              className="mt-3 rounded-lg border border-ph-warning/30 bg-ph-warning/5 px-3 py-2 font-sans text-xs text-ph-warning"
              role="status"
            >
              {narrative.thresholdAction}
            </p>
          ) : null}

          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted">
              What changed this week
            </div>
            <ul className="space-y-1">
              {narrative.weekChanges.map((line) => (
                <li
                  key={line}
                  className="font-sans text-xs leading-relaxed text-ph-text-tertiary"
                >
                  · {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <RiskTrendChart series={trendSeries} />
      </div>

      {expanded ? (
        <ul className="mt-4 space-y-3 border-t border-ph-borderSubtle pt-4">
          {factors.map((factor) => (
            <li key={factor.id}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-sans text-xs font-medium text-ph-text-secondary">
                  {factor.label}
                  <span className="ml-1.5 font-mono text-[10px] text-ph-text-muted">
                    {factor.weight}%
                  </span>
                </span>
                <span className="font-mono text-[11px] text-ph-text-tertiary">
                  {factor.score}/100
                </span>
              </div>
              <div className="mb-1 h-1 rounded-sm bg-ph-border">
                <div
                  className={`h-full rounded-sm transition-[width] duration-700 ease-out ${factorBarColor(factor.score)}`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <p className="font-sans text-[11px] text-ph-text-muted">
                {factor.summary}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </motion.section>
  );
}
