export const ROUTE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/aliases": "Aliases",
  "/inbox": "Alias inbox",
  "/vault": "Vault",
  "/brokers": "Data brokers",
  "/broker-removal": "Data brokers",
  "/call-guard": "Call Guard",
  "/dark-web": "Dark web",
  "/scam-engage": "Scam engage",
  "/threat-intel": "Threat intel",
  "/reports": "Reports",
  "/family": "Family",
  "/billing": "Billing",
  "/settings": "Settings",
};

export function titleForPath(pathname: string): string {
  const pathOnly = pathname.split("?")[0] ?? pathname;
  if (pathOnly === "/aliases" || pathOnly === "/aliases/") {
    return ROUTE_TITLES["/aliases"] ?? "Aliases";
  }
  if (pathOnly.startsWith("/aliases/")) {
    const id = pathOnly.slice("/aliases/".length);
    if (id.length > 0) return "Alias details";
  }
  return ROUTE_TITLES[pathOnly] ?? "Phantom";
}
