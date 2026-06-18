import type { AliasUsagePoint } from "@phantom/shared";

interface AliasUsageChartProps {
  series: readonly AliasUsagePoint[];
}

export function AliasUsageChart({ series }: AliasUsageChartProps) {
  if (series.length === 0) {
    return (
      <p className="font-sans text-xs text-ph-text-tertiary">
        No inbound email in the last 30 days — volume baseline builds as mail arrives.
      </p>
    );
  }

  const max = Math.max(...series.map((p) => p.inboundCount), 1);

  return (
    <div className="mt-3">
      <div className="flex h-16 items-end gap-1">
        {series.map((point) => {
          const h = Math.max(4, Math.round((point.inboundCount / max) * 100));
          return (
            <div
              key={point.date}
              className="group relative flex-1"
              title={`${point.date}: ${String(point.inboundCount)} message(s)`}
            >
              <div
                className="w-full rounded-sm bg-ph-accent transition-[height] duration-500 ease-out"
                style={{ height: `${String(h)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-ph-text-ghost">
        <span>{series[0]?.date.slice(5)}</span>
        <span>{series[series.length - 1]?.date.slice(5)}</span>
      </div>
      <p className="mt-2 font-sans text-[11px] text-ph-text-tertiary">
        30-day inbound volume — spikes may indicate list sales or spam campaigns.
      </p>
    </div>
  );
}
