export const ROUTE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/aliases": "Aliases",
  "/vault": "Vault",
  "/broker-removal": "Broker removal",
  "/call-guard": "Call Guard",
  "/dark-web": "Dark web",
  "/scam-engage": "Scam engage",
  "/threat-intel": "Threat intel",
  "/reports": "Reports",
  "/family": "Family",
  "/settings": "Settings",
};

export function titleForPath(pathname: string): string {
  return ROUTE_TITLES[pathname] ?? "Phantom";
}
