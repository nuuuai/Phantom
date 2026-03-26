import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QUICK_ACTIONS } from "@/lib/dashboardRoutes.js";
import { prefetchDashboardRoute } from "@/lib/routePrefetch.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function QuickActionsGrid() {
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl border border-ph-border bg-ph-surface p-5"
      aria-label="Quick actions"
    >
      <div className="mb-3.5 font-mono text-xs font-semibold uppercase tracking-wide text-ph-text-tertiary">
        Quick actions
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            onMouseEnter={() => prefetchDashboardRoute(a.to, accessToken)}
            onFocus={() => prefetchDashboardRoute(a.to, accessToken)}
            onClick={() => void navigate(a.to)}
            className="cursor-pointer rounded-lg border px-3 py-2.5 text-center font-sans text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ph-surface"
            style={{
              backgroundColor: `${a.color}08`,
              borderColor: `${a.color}20`,
              color: a.color,
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </motion.section>
  );
}
