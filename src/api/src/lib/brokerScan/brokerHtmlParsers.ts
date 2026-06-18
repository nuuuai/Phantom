import type { BrokerDataType } from "@phantom/shared";
import type { BrokerScanProbeResult, BrokerScanSubject } from "./brokerScanTypes.js";

function foundResult(
  dataTypes: BrokerDataType[],
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult {
  const types = new Set<BrokerDataType>(dataTypes);
  types.add("name");
  const lower = html.toLowerCase();
  if (subject.hasEmail || lower.includes("email")) types.add("email");
  if (/\(\d{3}\)|phone|mobile/.test(lower)) types.add("phone");
  if (lower.includes("address")) types.add("address");
  return { status: "found", dataTypesFound: [...types], probeMode: "live" };
}

function tokensMatch(html: string, subject: BrokerScanSubject): boolean {
  const lower = html.toLowerCase();
  const tokens = subject.searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  return tokens.some((t) => lower.includes(t));
}

function parseSpokeoHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (
    lower.includes("no results") ||
    lower.includes("0 results") ||
    lower.includes("we couldn't find")
  ) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (
    lower.includes("person-card") ||
    lower.includes("search-results") ||
    (lower.includes("results for") && tokensMatch(html, subject))
  ) {
    return foundResult(["name", "age", "address"], html, subject);
  }
  return null;
}

function parseTruePeopleSearchHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (lower.includes("no results found") || lower.includes("0 results")) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (
    lower.includes("card-summary") ||
    lower.includes("result-card") ||
    (lower.includes("records found") && tokensMatch(html, subject))
  ) {
    return foundResult(["name", "address", "relatives"], html, subject);
  }
  return null;
}

function parseFastPeopleSearchHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (lower.includes("no records found") || lower.includes("0 people")) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (
    lower.includes("people-found") ||
    lower.includes("search-result") ||
    tokensMatch(html, subject)
  ) {
    return foundResult(["name", "phone", "address"], html, subject);
  }
  return null;
}

function parseWhitepagesHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (lower.includes("no match") || lower.includes("0 matches")) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (
    lower.includes("lookup-result") ||
    lower.includes("person-result") ||
    (lower.includes("matches for") && tokensMatch(html, subject))
  ) {
    return foundResult(["name", "phone", "address"], html, subject);
  }
  return null;
}

function parseBeenVerifiedHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (lower.includes("no results") || lower.includes("0 records")) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (
    lower.includes("result-item") ||
    lower.includes("person-search") ||
    tokensMatch(html, subject)
  ) {
    return foundResult(["name", "email", "phone"], html, subject);
  }
  return null;
}

function parseInteliusHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (lower.includes("no records") || lower.includes("0 results")) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (
    lower.includes("search-results") ||
    lower.includes("report-preview") ||
    tokensMatch(html, subject)
  ) {
    return foundResult(["name", "address", "relatives"], html, subject);
  }
  return null;
}

function parseRadarisHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (lower.includes("no results") || lower.includes("0 records")) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (lower.includes("profile-card") || lower.includes("radaris-search") || tokensMatch(html, subject)) {
    return foundResult(["name", "address", "relatives"], html, subject);
  }
  return null;
}

function parseMylifeHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (lower.includes("no profile") || lower.includes("0 matches")) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (lower.includes("public-page") || lower.includes("reputation-score") || tokensMatch(html, subject)) {
    return foundResult(["name", "age", "relatives"], html, subject);
  }
  return null;
}

function parseZabasearchHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (lower.includes("no records") || lower.includes("not found")) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (lower.includes("result-list") || lower.includes("person-record") || tokensMatch(html, subject)) {
    return foundResult(["name", "phone", "address"], html, subject);
  }
  return null;
}

function parsePeoplefinderHtml(
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const lower = html.toLowerCase();
  if (lower.includes("no results") || lower.includes("0 people")) {
    return { status: "not_found", dataTypesFound: [], probeMode: "live" };
  }
  if (lower.includes("search-result") || lower.includes("person-details") || tokensMatch(html, subject)) {
    return foundResult(["name", "email", "address"], html, subject);
  }
  return null;
}

const DOMAIN_PARSERS: Record<
  string,
  (html: string, subject: BrokerScanSubject) => BrokerScanProbeResult | null
> = {
  "spokeo.com": parseSpokeoHtml,
  "www.spokeo.com": parseSpokeoHtml,
  "truepeoplesearch.com": parseTruePeopleSearchHtml,
  "www.truepeoplesearch.com": parseTruePeopleSearchHtml,
  "fastpeoplesearch.com": parseFastPeopleSearchHtml,
  "www.fastpeoplesearch.com": parseFastPeopleSearchHtml,
  "whitepages.com": parseWhitepagesHtml,
  "www.whitepages.com": parseWhitepagesHtml,
  "beenverified.com": parseBeenVerifiedHtml,
  "www.beenverified.com": parseBeenVerifiedHtml,
  "intelius.com": parseInteliusHtml,
  "www.intelius.com": parseInteliusHtml,
  "radaris.com": parseRadarisHtml,
  "www.radaris.com": parseRadarisHtml,
  "mylife.com": parseMylifeHtml,
  "www.mylife.com": parseMylifeHtml,
  "zabasearch.com": parseZabasearchHtml,
  "www.zabasearch.com": parseZabasearchHtml,
  "peoplefinder.com": parsePeoplefinderHtml,
  "www.peoplefinder.com": parsePeoplefinderHtml,
};

/** Domain-specific HTML probe — returns null to fall back to generic heuristics. */
export function parseBrokerHtml(
  domain: string,
  html: string,
  subject: BrokerScanSubject
): BrokerScanProbeResult | null {
  const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "");
  const bare = normalized.replace(/^www\./, "");
  const parser =
    DOMAIN_PARSERS[normalized] ??
    DOMAIN_PARSERS[bare] ??
    DOMAIN_PARSERS[`www.${bare}`];
  if (!parser) return null;
  return parser(html, subject);
}
