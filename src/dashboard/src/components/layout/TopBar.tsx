import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NotificationCenter } from "@/features/notifications/NotificationCenter.js";
import { titleForPath } from "@/lib/routeTitles.js";

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = useMemo(
    () => titleForPath(location.pathname),
    [location.pathname]
  );

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-ph-border bg-ph-topbar px-8 py-4">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-ph-text-primary">
          {title}
        </span>
        <span className="font-mono text-xs text-ph-text-tertiary">{dateLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <button
          type="button"
          className="cursor-pointer rounded-md border border-[#2a2a34] bg-ph-raised px-3.5 py-1.5 font-sans text-xs text-ph-text-secondary"
        >
          This month ▾
        </button>
        <button
          type="button"
          onClick={() => navigate("/aliases")}
          className="cursor-pointer rounded-md border border-ph-accent-border bg-[#6C3AED15] px-3.5 py-1.5 font-sans text-xs font-medium text-ph-accent-light"
        >
          + Generate alias
        </button>
      </div>
    </div>
  );
}
