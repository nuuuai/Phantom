import { motion } from "framer-motion";

interface DailyBriefProps {
  lines: readonly string[];
}

export function DailyBrief({ lines }: DailyBriefProps) {
  if (lines.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mb-5 rounded-xl border border-ph-accent-border bg-ph-accent/[0.08] p-5"
      aria-label="Daily brief"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-ph-accent-light shadow-[0_0_6px_rgba(167,139,250,0.5)]"
          aria-hidden
        />
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-ph-accent-light">
          Daily brief
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wide text-ph-text-muted">
          Brain
        </span>
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <p
            key={String(i)}
            className="font-sans text-[13px] leading-relaxed text-ph-text-secondary"
          >
            {line}
          </p>
        ))}
      </div>
    </motion.section>
  );
}
