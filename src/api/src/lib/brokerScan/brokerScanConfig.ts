/** Default domains for live HTTP broker probes (core catalog). */
export const BROKER_SCAN_LIVE_DOMAIN_DEFAULTS = [
  "spokeo.com",
  "whitepages.com",
  "beenverified.com",
  "intelius.com",
  "truepeoplesearch.com",
  "fastpeoplesearch.com",
  "radaris.com",
  "mylife.com",
  "zabasearch.com",
  "peoplefinder.com",
] as const;

export type BrokerScanProviderId = "mock" | "live" | "hybrid";

export function getBrokerScanProviderId(): BrokerScanProviderId {
  const raw = process.env.BROKER_SCAN_PROVIDER?.trim().toLowerCase();
  if (raw === "live") return "live";
  if (raw === "hybrid") return "hybrid";
  return "mock";
}

export function getBrokerScanLiveDomains(): ReadonlySet<string> {
  const raw = process.env.BROKER_SCAN_LIVE_DOMAINS?.trim();
  const list = raw
    ? raw.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean)
    : [...BROKER_SCAN_LIVE_DOMAIN_DEFAULTS];
  return new Set(list);
}

export function getBrokerScanHttpTimeoutMs(): number {
  const raw = process.env.BROKER_SCAN_HTTP_TIMEOUT_MS?.trim();
  const n = raw ? parseInt(raw, 10) : 8000;
  if (!Number.isFinite(n) || n < 2000 || n > 30000) return 8000;
  return n;
}

export function shouldUseLiveProbe(domain: string): boolean {
  const provider = getBrokerScanProviderId();
  const liveDomains = getBrokerScanLiveDomains();
  const normalized = domain.trim().toLowerCase();
  if (provider === "mock") return false;
  if (provider === "live") return liveDomains.has(normalized);
  return liveDomains.has(normalized);
}
