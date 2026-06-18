import { Link } from "react-router-dom";
import type { InboxSummary } from "@phantom/shared";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { DASHBOARD_PATHS } from "@/lib/dashboardRoutes.js";

interface InboxSummaryPanelProps {
  summary: InboxSummary;
}

const CATEGORY_LABELS: Record<string, string> = {
  spam: "Spam",
  marketing: "Marketing",
  transactional: "Transactional",
  phishing: "Phishing",
  personal: "Personal",
  unknown: "Unknown",
};

export function InboxSummaryPanel({ summary }: InboxSummaryPanelProps) {
  if (summary.totalMessages === 0) return null;

  const brain = LAYER_STYLES.brain;
  const categories = Object.entries(summary.byCategory).filter(([, n]) => n > 0);

  return (
    <section className="mb-6 rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{
            color: brain.text,
            backgroundColor: brain.bg,
            borderColor: brain.border,
          }}
        >
          Brain
        </span>
        <h2 className="font-sans text-sm font-semibold text-ph-text-primary">
          Inbox intelligence
        </h2>
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        AI classification across your {String(summary.totalMessages)} most recent
        message(s) · {String(summary.unreadCount)} unread
      </p>

      {categories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map(([cat, count]) => (
            <span
              key={cat}
              className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
                cat === "phishing"
                  ? "border-ph-danger/40 text-ph-danger"
                  : cat === "spam"
                    ? "border-ph-warning/40 text-ph-warning"
                    : "border-ph-border text-ph-text-tertiary"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat} · {String(count)}
            </span>
          ))}
        </div>
      ) : null}

      {summary.topThreats.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {summary.topThreats.slice(0, 3).map((t) => (
            <li
              key={t.messageId}
              className="font-sans text-[11px] text-ph-text-secondary"
            >
              · {t.category} risk {t.phishingScore}/100
              {t.signals[0] ? ` — ${t.signals[0]}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        to={DASHBOARD_PATHS.inbox}
        className="mt-4 inline-block font-sans text-[11px] text-ph-accent-light hover:underline"
      >
        Review inbox →
      </Link>
    </section>
  );
}
