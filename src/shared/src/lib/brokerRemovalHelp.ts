import type { BrokerRemovalMethod, DataBroker } from "../types/brokerScan.js";

/** Human-readable label for catalog `removalMethod` (dashboard expanded row). */
export function brokerRemovalMethodLabel(method: BrokerRemovalMethod): string {
  switch (method) {
    case "api":
      return "API queue (simulated)";
    case "form":
      return "Web form (DIY)";
    case "email":
      return "Email opt-out (DIY)";
    case "manual":
      return "Manual / DIY";
  }
}

/** Privacy-friendly search for opt-out instructions when we have no verified URL. */
export function brokerRemovalSearchUrl(brokerName: string): string {
  const q = encodeURIComponent(`${brokerName} opt out remove my data`);
  return `https://duckduckgo.com/?q=${q}`;
}

/**
 * Prefer catalog `removalUrl`; otherwise a search URL (never guess `https://domain/optout`).
 */
export function resolveBrokerRemovalHref(broker: DataBroker): string {
  const u = broker.removalUrl?.trim();
  if (u) return u;
  return brokerRemovalSearchUrl(broker.name);
}

export function brokerRemovalLinkLabel(broker: DataBroker): string {
  return broker.removalUrl?.trim() ? "Open removal page" : "Search opt-out help";
}
