import { NavLink } from "react-router-dom";
import { DASHBOARD_PATHS } from "@/lib/dashboardRoutes.js";

const LINKS = [
  { label: "Overview", to: DASHBOARD_PATHS.home, end: true },
  { label: "Aliases", to: DASHBOARD_PATHS.aliases, end: false },
  { label: "Inbox", to: DASHBOARD_PATHS.inbox, end: false },
  { label: "Vault", to: DASHBOARD_PATHS.vault, end: false },
  { label: "Brokers", to: DASHBOARD_PATHS.brokers, end: false },
  { label: "Billing", to: DASHBOARD_PATHS.billing, end: false },
  { label: "Settings", to: DASHBOARD_PATHS.settings, end: false },
] as const;

/**
 * Horizontal scroll strip for small viewports (sidebar is hidden below `md`).
 */
export function MobileNavBar() {
  return (
    <nav
      className="shrink-0 border-b border-ph-border bg-ph-surface md:hidden"
      aria-label="Primary sections"
    >
      <div className="flex gap-1 overflow-x-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LINKS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                "shrink-0 rounded-md px-3 py-2 font-sans text-[12px] font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-ph-raised text-white"
                  : "text-ph-text-tertiary hover:bg-ph-raised/50 hover:text-ph-text-primary",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
