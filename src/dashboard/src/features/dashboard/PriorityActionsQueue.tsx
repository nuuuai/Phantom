import type { PriorityAction } from "@phantom/shared";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LAYER_STYLES } from "@/lib/layerColors.js";

interface PriorityActionsQueueProps {
  actions: readonly PriorityAction[];
}

export function PriorityActionsQueue({ actions }: PriorityActionsQueueProps) {
  if (actions.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="mb-5 rounded-xl border border-ph-border bg-ph-surface p-5"
      aria-label="Priority actions"
    >
      <div className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-ph-text-tertiary">
        Priority actions
      </div>
      <ul className="space-y-2">
        {actions.map((action, i) => {
          const layer = LAYER_STYLES[action.layer];
          return (
            <li
              key={action.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-ph-borderSubtle bg-ph-raised/40 px-4 py-3"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-ph-text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: layer.text,
                      backgroundColor: layer.bg,
                      borderColor: layer.border,
                    }}
                  >
                    {action.layer}
                  </span>
                </div>
                <div className="font-sans text-[13px] font-medium text-ph-text-primary">
                  {action.title}
                </div>
                <p className="mt-0.5 font-sans text-xs text-ph-text-tertiary">
                  {action.description}
                </p>
              </div>
              <Link
                to={action.href}
                className="shrink-0 rounded-md border border-ph-accent-border bg-ph-accent/[0.12] px-3 py-1.5 font-sans text-xs font-medium text-ph-accent-light transition-colors hover:bg-ph-accent/[0.2]"
              >
                Go
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
