import type { AliasCategory } from "../types/alias.js";

const DOMAIN_RULES: ReadonlyArray<{ pattern: RegExp; category: AliasCategory }> = [
  { pattern: /amazon|ebay|etsy|shopify|walmart|target\.com/i, category: "shopping" },
  { pattern: /paypal|chase|bank|capitalone|wellsfargo|stripe/i, category: "finance" },
  { pattern: /linkedin|facebook|instagram|twitter|x\.com|tiktok|reddit/i, category: "social" },
  { pattern: /tinder|bumble|hinge|match\.com|okcupid/i, category: "dating" },
  { pattern: /slack|notion|asana|jira|github|gitlab|microsoft\.com/i, category: "work" },
  { pattern: /substack|mailchimp|newsletter|medium\.com/i, category: "newsletter" },
];

function hostnameFromUrl(serviceUrl: string): string | null {
  try {
    const withProtocol = serviceUrl.includes("://")
      ? serviceUrl
      : `https://${serviceUrl}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Infers alias category from service URL domain heuristics. */
export function inferAliasCategory(serviceUrl: string | null | undefined): AliasCategory | null {
  if (!serviceUrl || serviceUrl.trim().length === 0) return null;

  const host = hostnameFromUrl(serviceUrl.trim());
  const probe = host ?? serviceUrl.toLowerCase();

  for (const rule of DOMAIN_RULES) {
    if (rule.pattern.test(probe)) return rule.category;
  }

  return "temp";
}
