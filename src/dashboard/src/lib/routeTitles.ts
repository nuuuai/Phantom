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
  return ROUTE_TITLES[pathname] ?? "Phantom";
}
