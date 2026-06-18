import { Link } from "react-router-dom";
import { DASHBOARD_PATHS } from "@/lib/dashboardRoutes.js";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-8 py-16 text-center">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ph-text-muted">
        404
      </p>
      <h1 className="mt-2 font-sans text-xl font-semibold text-ph-text-primary">
        Page not found
      </h1>
      <p className="mt-2 max-w-md font-sans text-sm text-ph-text-tertiary">
        This route is not part of your Phantom command center.
      </p>
      <Link
        to={DASHBOARD_PATHS.home}
        className="mt-6 rounded-md border border-ph-accent-border bg-ph-accent/[0.12] px-4 py-2 font-sans text-sm font-medium text-ph-accent-light hover:bg-ph-accent/[0.2]"
      >
        Back to overview
      </Link>
    </div>
  );
}
