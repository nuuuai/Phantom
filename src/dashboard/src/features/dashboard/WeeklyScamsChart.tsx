import { motion } from "framer-motion";

interface WeeklyScamsChartProps {
  values: readonly number[];
  labels: readonly string[];
}

export function WeeklyScamsChart({ values, labels }: WeeklyScamsChartProps) {
  const maxScam = Math.max(...values);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-ph-border bg-ph-surface p-5"
    >
      <div className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-ph-text-tertiary">
        Scams this week
      </div>
      <div className="flex h-20 items-end gap-2">
        {values.map((v, i) => (
          <div
            key={labels[i] ?? String(i)}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <div className="font-mono text-[10px] text-ph-text-tertiary">
              {v}
            </div>
            <div
              className="w-full rounded"
              style={{
                height: `${(v / maxScam) * 60}px`,
                backgroundColor:
                  i === values.length - 1 ? "#6C3AED" : "#222230",
                transition: "height 0.8s ease",
              }}
            />
            <div className="font-sans text-[10px] text-ph-text-muted">
              {labels[i]}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
