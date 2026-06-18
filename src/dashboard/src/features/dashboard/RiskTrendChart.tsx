import type { RiskTrendPoint } from "@phantom/shared";

interface RiskTrendChartProps {
  series: readonly RiskTrendPoint[];
}

function formatWeekLabel(isoDate: string, index: number, total: number): string {
  if (index === total - 1) return "Now";
  if (index === 0) return "90d";
  if (index % 3 !== 0) return "";
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RiskTrendChart({ series }: RiskTrendChartProps) {
  if (series.length === 0) return null;

  const maxScore = Math.max(92, ...series.map((p) => p.score));
  const minScore = Math.min(12, ...series.map((p) => p.score));
  const range = Math.max(1, maxScore - minScore);

  return (
    <div aria-label="90-day risk trend">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ph-text-muted">
        90-day trend
      </div>
      <div className="flex h-24 items-end gap-1">
        {series.map((point, i) => {
          const heightPct = ((point.score - minScore) / range) * 100;
          const isLatest = i === series.length - 1;
          return (
            <div
              key={point.weekEnding}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              title={`${point.weekEnding}: ${point.score}/100`}
            >
              <div className="font-mono text-[9px] text-ph-text-ghost">
                {isLatest ? point.score : ""}
              </div>
              <div
                className="w-full rounded-sm transition-[height] duration-700 ease-out"
                style={{
                  height: `${Math.max(8, heightPct * 0.72)}px`,
                  backgroundColor: isLatest ? "#6C3AED" : "#222230",
                }}
              />
              <div className="font-sans text-[9px] text-ph-text-muted">
                {formatWeekLabel(point.weekEnding, i, series.length)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
