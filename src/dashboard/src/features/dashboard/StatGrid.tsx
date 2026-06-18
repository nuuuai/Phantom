import type { DashboardOverview } from "@phantom/shared";
import { RISK_THRESHOLDS } from "@phantom/shared";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter.js";

interface StatGridProps {
  data: DashboardOverview;
}

function riskScoreColor(score: number): string {
  if (score <= RISK_THRESHOLDS.LOW_MAX) return "text-ph-success";
  if (score <= RISK_THRESHOLDS.MODERATE_MAX) return "text-ph-info";
  if (score <= RISK_THRESHOLDS.ELEVATED_MAX) return "text-ph-warning";
  return "text-ph-danger";
}

export function StatGrid({ data }: StatGridProps) {
  const brokerPct =
    data.brokersFound > 0
      ? (data.brokersRemoved / data.brokersFound) * 100
      : 0;

  const scoreClass = riskScoreColor(data.riskScore);

  return (
    <div className="mb-5 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-ph-border animate-fade-up md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-ph-surface px-5 py-6">
        <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-wide text-ph-text-tertiary">
          Risk score
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-[40px] font-light tracking-[-0.02em] ${scoreClass}`}>
            <AnimatedCounter value={data.riskScore} />
          </span>
          {data.riskTrend !== 0 ? (
            <span
              className={`text-[13px] font-medium ${data.riskTrend < 0 ? "text-ph-success" : "text-ph-danger"}`}
            >
              {data.riskTrend < 0 ? "↓" : "↑"}
              {Math.abs(data.riskTrend)}
            </span>
          ) : null}
        </div>
        <div className="mt-1 font-sans text-xs text-ph-text-muted">
          See Risk intelligence below for factor breakdown
        </div>
      </div>

      <div className="bg-ph-surface px-5 py-6">
        <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-wide text-ph-text-tertiary">
          Active aliases
        </div>
        <div className="text-[40px] font-light tracking-[-0.02em] text-ph-text-primary">
          <AnimatedCounter value={data.activeAliases} />
        </div>
        <div className="mt-1.5 flex gap-3 font-sans text-xs">
          <span className="text-ph-success">{data.aliasesHealthy} healthy</span>
          <span className="text-ph-warning">{data.aliasesWarning} warning</span>
          <span className="text-ph-danger">{data.aliasesCompromised} critical</span>
        </div>
      </div>

      <div className="bg-ph-surface px-5 py-6">
        <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-wide text-ph-text-tertiary">
          Brokers
        </div>
        <div className="text-[40px] font-light tracking-[-0.02em] text-ph-text-primary">
          <AnimatedCounter value={data.brokersRemoved} />
          <span className="text-lg text-ph-text-tertiary">
            /{data.brokersFound}
          </span>
        </div>
        <div className="mt-2.5 h-1 rounded-sm bg-ph-border">
          <div
            className="h-full rounded-sm bg-ph-success transition-[width] duration-[1500ms] ease-out"
            style={{ width: `${brokerPct}%` }}
          />
        </div>
      </div>

      <div className="bg-ph-surface px-5 py-6">
        <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-wide text-ph-text-tertiary">
          {data.metricsDemoMode ? "Scam engage" : "Inbox unread"}
        </div>
        {data.metricsDemoMode ? (
          <>
            <div className="text-[40px] font-light tracking-[-0.02em] text-ph-danger">
              <AnimatedCounter value={data.scammerMinutes} />
              <span className="text-sm text-ph-text-tertiary"> min</span>
            </div>
            <div className="mt-1 font-sans text-xs text-ph-text-muted">
              {data.scamsEngaged} scammers · {data.complaintsFile} complaints
            </div>
          </>
        ) : (
          <>
            <div className="text-[40px] font-light tracking-[-0.02em] text-ph-text-primary">
              <AnimatedCounter value={data.unreadInbox} />
            </div>
            <div className="mt-1 font-sans text-xs text-ph-text-muted">
              Alias mail awaiting review
            </div>
          </>
        )}
      </div>
    </div>
  );
}
