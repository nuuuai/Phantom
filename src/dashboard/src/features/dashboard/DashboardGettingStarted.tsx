import { Link } from "react-router-dom";
import { DASHBOARD_PATHS } from "@/lib/dashboardRoutes.js";

/**
 * Shown when the user has no aliases yet — nudges core Phase 1 flows without blocking the dashboard.
 */
export function DashboardGettingStarted() {
  return (
    <div className="mb-5 rounded-xl border border-ph-accent-border/50 bg-[#6C3AED0d] px-4 py-4 sm:px-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-accent-light">
        Get started
      </div>
      <p className="mt-2 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        Follow the path: alias → inbox → vault → broker scan → Pro. Install the
        Chrome extension for autofill when you&apos;re ready (see onboarding).
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        <li>
          <Link
            to={DASHBOARD_PATHS.aliases}
            className="inline-flex rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs font-medium text-ph-accent-light hover:bg-ph-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/50"
          >
            Create an alias
          </Link>
        </li>
        <li>
          <Link
            to={DASHBOARD_PATHS.inbox}
            className="inline-flex rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs font-medium text-ph-text-secondary hover:bg-ph-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/50"
          >
            Open alias inbox
          </Link>
        </li>
        <li>
          <Link
            to={DASHBOARD_PATHS.vault}
            className="inline-flex rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs font-medium text-ph-text-secondary hover:bg-ph-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/50"
          >
            Open vault
          </Link>
        </li>
        <li>
          <Link
            to={DASHBOARD_PATHS.brokers}
            className="inline-flex rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs font-medium text-ph-text-secondary hover:bg-ph-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/50"
          >
            Scan data brokers
          </Link>
        </li>
        <li>
          <Link
            to={DASHBOARD_PATHS.billing}
            className="inline-flex rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs font-medium text-ph-text-secondary hover:bg-ph-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/50"
          >
            Billing & Pro
          </Link>
        </li>
        <li>
          <Link
            to={DASHBOARD_PATHS.settings}
            className="inline-flex rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs font-medium text-ph-text-secondary hover:bg-ph-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/50"
          >
            Settings & notifications
          </Link>
        </li>
      </ul>
    </div>
  );
}
