import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "New alias", to: "/aliases", color: "#6C3AED" },
  { label: "Run broker scan", to: "/brokers", color: "#34D399" },
  { label: "Alias inbox", to: "/inbox", color: "#FBBF24" },
  { label: "Billing & Pro", to: "/billing", color: "#60A5FA" },
] as const;

export function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl border border-ph-border bg-ph-surface p-5"
    >
      <div className="mb-3.5 font-mono text-xs font-semibold uppercase tracking-wide text-ph-text-tertiary">
        Quick actions
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => void navigate(a.to)}
            className="cursor-pointer rounded-lg border px-3 py-2.5 text-center font-sans text-xs font-medium transition-colors duration-200"
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
    </motion.div>
  );
}
