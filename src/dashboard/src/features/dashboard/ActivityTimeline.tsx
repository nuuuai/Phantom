import type { ActivityItem } from "@phantom/shared";
import { motion } from "framer-motion";
import { LAYER_STYLES } from "@/lib/layerColors.js";

interface ActivityTimelineProps {
  items: readonly ActivityItem[];
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <div>
      <div className="mb-3.5 font-sans text-sm font-semibold text-ph-text-secondary">
        Activity timeline
      </div>
      <div className="flex flex-col">
        {items.map((a, i) => {
          const lc = LAYER_STYLES[a.type];
          return (
            <motion.div
              key={`${a.label}-${String(i)}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.08 }}
              className="flex gap-3.5 border-b border-ph-borderSubtle py-3.5 last:border-b-0"
            >
              <div
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: lc.text,
                  boxShadow: `0 0 8px ${lc.text}40`,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-block rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{
                      color: lc.text,
                      backgroundColor: lc.bg,
                      border: `1px solid ${lc.border}`,
                    }}
                  >
                    {a.type}
                  </span>
                  <span className="font-sans text-[13px] font-medium text-[#d0d0d8]">
                    {a.label}
                  </span>
                </div>
                <div className="font-sans text-xs leading-snug text-ph-text-tertiary">
                  {a.desc}
                </div>
              </div>
              <div className="mt-0.5 shrink-0 font-mono text-[11px] text-ph-text-ghost">
                {a.time}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
