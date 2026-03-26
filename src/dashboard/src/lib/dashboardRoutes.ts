/**
 * Single source of truth for dashboard paths used by onboarding, quick actions, and tests.
 * Keep in sync with `App.tsx` routes.
 */
export const DASHBOARD_PATHS = {
  home: "/",
  aliases: "/aliases",
  inbox: "/inbox",
  vault: "/vault",
  brokers: "/brokers",
  billing: "/billing",
  settings: "/settings",
} as const;

export type DashboardPath =
  (typeof DASHBOARD_PATHS)[keyof typeof DASHBOARD_PATHS];

export const QUICK_ACTIONS = [
  { label: "New alias", to: DASHBOARD_PATHS.aliases, color: "#6C3AED" },
  { label: "Vault", to: DASHBOARD_PATHS.vault, color: "#A78BFA" },
  { label: "Run broker scan", to: DASHBOARD_PATHS.brokers, color: "#34D399" },
  { label: "Alias inbox", to: DASHBOARD_PATHS.inbox, color: "#FBBF24" },
  { label: "Billing & Pro", to: DASHBOARD_PATHS.billing, color: "#60A5FA" },
  { label: "Settings", to: DASHBOARD_PATHS.settings, color: "#94A3B8" },
] as const;

/** Default Chrome Web Store root; override with `VITE_CWS_LISTING_URL` when the listing exists. */
export function chromeWebStoreHref(): string {
  const fromEnv = import.meta.env.VITE_CWS_LISTING_URL;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  return "https://chromewebstore.google.com/";
}
