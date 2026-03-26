import { useEffect, useState } from "react";

interface BrokerScanningStateProps {
  brokerNames: readonly string[];
  totalBrokers: number;
  estimatedTime: number;
}

export function BrokerScanningState({
  brokerNames,
  totalBrokers,
  estimatedTime,
}: BrokerScanningStateProps) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (brokerNames.length === 0) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % brokerNames.length);
    }, 420);
    return () => window.clearInterval(t);
  }, [brokerNames.length]);

  useEffect(() => {
    const start = Date.now();
    const dur = Math.min(120_000, 8000 + estimatedTime * 40);
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(92, (elapsed / dur) * 92);
      setProgress(p);
    }, 120);
    return () => window.clearInterval(tick);
  }, [estimatedTime]);

  const current = brokerNames[idx] ?? "…";

  return (
    <div className="rounded-xl border border-ph-border bg-ph-surface p-8">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ph-text-tertiary">
        Active scan
      </div>
      <h2 className="mt-2 font-sans text-lg font-semibold text-ph-text-primary">
        Scanning broker registry
      </h2>
      <p className="mt-2 max-w-xl font-sans text-sm text-ph-text-tertiary">
        Checking public and subscription data sources for your name, phone,
        email, and address variants. This is simulated in Phase 1 — no live
        queries leave your browser until production workers launch.
      </p>

      <div className="mt-8 h-1 w-full overflow-hidden rounded-sm bg-ph-border">
        <div
          className="h-full rounded-sm bg-ph-accent transition-[width] duration-300 ease-out"
          style={{ width: `${String(progress)}%` }}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="font-mono text-xs text-ph-text-ghost">
          {Math.min(totalBrokers, Math.floor((progress / 92) * totalBrokers))} /{" "}
          {totalBrokers} brokers scanned
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-ph-borderSubtle bg-ph-bg px-4 py-3">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
          Current check
        </div>
        <div className="mt-1 font-sans text-sm text-ph-text-primary">
          {current}
        </div>
      </div>
    </div>
  );
}
