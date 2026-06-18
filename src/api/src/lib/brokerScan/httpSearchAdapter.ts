import type { BrokerDataType } from "@phantom/shared";
import type { BrokerScanProbeResult, BrokerScanSubject } from "./brokerScanTypes.js";
import { parseBrokerHtml } from "./brokerHtmlParsers.js";
import { getBrokerScanHttpTimeoutMs } from "./brokerScanConfig.js";

const FOUND_SIGNALS = [
  "results found",
  "records found",
  "we found",
  "people named",
  "matching records",
  "possible matches",
  "search results",
] as const;

function buildSearchUrl(domain: string, query: string): string {
  const q = encodeURIComponent(query);
  const d = domain.replace(/^www\./, "");
  switch (d) {
    case "truepeoplesearch.com":
      return `https://www.truepeoplesearch.com/results?name=${q}`;
    case "fastpeoplesearch.com":
      return `https://www.fastpeoplesearch.com/name/${q.replace(/%20/g, "-")}`;
    default:
      return `https://www.${d}/search?q=${q}`;
  }
}

function inferDataTypes(
  html: string,
  subject: BrokerScanSubject
): BrokerDataType[] {
  const lower = html.toLowerCase();
  const types = new Set<BrokerDataType>(["name"]);
  if (subject.hasEmail || lower.includes("email")) types.add("email");
  if (/\(\d{3}\)|phone|mobile|cell/.test(lower)) types.add("phone");
  if (lower.includes("address") || lower.includes("street")) types.add("address");
  if (lower.includes("age") || lower.includes("born")) types.add("age");
  if (lower.includes("relative") || lower.includes("associated")) {
    types.add("relatives");
  }
  return [...types];
}

export function analyzeHtmlForExposure(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult {
  const lower = html.toLowerCase();
  const queryTokens = subject.searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const signalHit = FOUND_SIGNALS.some((s) => lower.includes(s));
  const tokenHit =
    queryTokens.length > 0 &&
    queryTokens.filter((t) => lower.includes(t)).length >= 1;

  if (signalHit || tokenHit) {
    return {
      status: "found",
      dataTypesFound: inferDataTypes(html, subject),
      probeMode: "live",
    };
  }
  return { status: "not_found", dataTypesFound: [], probeMode: "live" };
}

export async function probeBrokerViaHttp(
  domain: string,
  subject: BrokerScanSubject,
  fetchFn: typeof fetch = fetch
): Promise<BrokerScanProbeResult> {
  const timeoutMs = getBrokerScanHttpTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = buildSearchUrl(domain, subject.searchQuery);
    const res = await fetchFn(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "PhantomBrokerScan/1.0 (privacy-opt-out; +https://phantom.local)",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return { status: "not_found", dataTypesFound: [], probeMode: "live" };
    }
    const html = await res.text();
    if (html.length < 200) {
      return { status: "not_found", dataTypesFound: [], probeMode: "live" };
    }
    const parsed = parseBrokerHtml(domain, html, subject);
    if (parsed) return parsed;
    return analyzeHtmlForExposure(html, subject);
  } catch {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  } finally {
    clearTimeout(timer);
  }
}
