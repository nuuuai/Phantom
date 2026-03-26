import { NavLink } from "react-router-dom";
import { shouldSkipDevBootstrap } from "@/lib/devBootstrap.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

type NavId =
  | "overview"
  | "aliases"
  | "vault"
  | "brokers"
  | "callguard"
  | "darkweb"
  | "engage"
  | "intel"
  | "reports"
  | "family"
  | "settings";

interface NavItem {
  id: NavId;
  label: string;
  path: string;
}

interface NavSection {
  group: string;
  items: readonly NavItem[];
}

const sections: readonly NavSection[] = [
  {
    group: "CORE",
    items: [
      { id: "overview", label: "Overview", path: "/" },
      { id: "aliases", label: "Aliases", path: "/aliases" },
      { id: "vault", label: "Vault", path: "/vault" },
    ],
  },
  {
    group: "DEFENSE",
    items: [
      { id: "brokers", label: "Broker removal", path: "/brokers" },
      { id: "callguard", label: "Call Guard", path: "/call-guard" },
      { id: "darkweb", label: "Dark web", path: "/dark-web" },
    ],
  },
  {
    group: "OFFENSE",
    items: [
      { id: "engage", label: "Scam engage", path: "/scam-engage" },
      { id: "intel", label: "Threat intel", path: "/threat-intel" },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { id: "reports", label: "Reports", path: "/reports" },
      { id: "family", label: "Family", path: "/family" },
      { id: "settings", label: "Settings", path: "/settings" },
    ],
  },
];

export function SidebarNav() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const darkWebAlerts = useSessionStore((s) => s.darkWebAlerts);
  const displayName = useSessionStore((s) => s.displayName);
  const planLabel = useSessionStore((s) => s.planLabel);

  const initial = displayName.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <div className="flex w-[230px] shrink-0 flex-col border-r border-ph-border bg-ph-surface">
      <div className="border-b border-ph-border px-6 pb-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ph-accent to-[#8B5CF6]">
            <div
              className="h-3 w-3 rotate-45 border-2 border-white/90"
              aria-hidden
            />
          </div>
          <div className="text-base font-semibold tracking-[0.2em] text-ph-text-primary">
            PHANTOM
          </div>
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto py-2"
        aria-label="Primary navigation"
      >
        {sections.map((section) => (
          <div key={section.group} className="mb-1">
            <div className="px-6 pb-1.5 pt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ph-text-muted">
              {section.group}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  [
                    "block cursor-pointer border-r-2 py-2 pl-6 pr-6 font-sans text-[13px] transition-colors duration-150",
                    isActive
                      ? "border-ph-accent bg-ph-raised font-semibold text-white"
                      : "border-transparent font-normal text-[#66666e] hover:bg-ph-raised/50 hover:text-ph-text-primary",
                  ].join(" ")
                }
              >
                {item.label}
                {item.id === "darkweb" && darkWebAlerts > 0 ? (
                  <span className="ml-2 inline-block rounded px-1.5 py-px font-sans text-[10px] font-semibold text-ph-danger [background:rgba(248,113,113,0.2)]">
                    {darkWebAlerts}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-ph-border px-6 py-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ph-accent font-sans text-xs font-semibold text-white">
          {initial}
        </div>
        <div className="truncate font-sans text-[13px] font-medium text-ph-text-primary">
          {!accessToken && !shouldSkipDevBootstrap()
            ? "Connecting…"
            : !accessToken
              ? "Signed out"
              : displayName}
        </div>
        <div className="ml-auto font-sans text-[10px] font-semibold text-ph-accent">
          {!accessToken && !shouldSkipDevBootstrap()
            ? "…"
            : !accessToken
              ? "—"
              : planLabel}
        </div>
      </div>
    </div>
  );
}
