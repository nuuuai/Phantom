import type {
  AliasCategory,
  AliasType,
  HealthStatus,
} from "../types/alias.js";
import { inferAliasCategory } from "./inferAliasCategory.js";

export interface AliasSiteMatchCandidate {
  id: string;
  type: AliasType;
  category: AliasCategory;
  serviceUrl: string | null;
  serviceName: string | null;
  value: string;
  isActive: boolean;
  healthStatus: HealthStatus;
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

function hostnameFromServiceUrl(serviceUrl: string): string | null {
  try {
    const withProtocol = serviceUrl.includes("://")
      ? serviceUrl
      : `https://${serviceUrl}`;
    return normalizeHostname(new URL(withProtocol).hostname);
  } catch {
    return null;
  }
}

function scoreAliasForSite(
  alias: AliasSiteMatchCandidate,
  siteHost: string,
  inferredCategory: AliasCategory | null
): number {
  let score = 0;

  if (alias.serviceUrl) {
    const aliasHost = hostnameFromServiceUrl(alias.serviceUrl);
    if (aliasHost === siteHost) score += 100;
    else if (aliasHost && (siteHost.endsWith(aliasHost) || aliasHost.endsWith(siteHost))) {
      score += 70;
    }
  }

  if (inferredCategory && alias.category === inferredCategory) score += 40;

  if (alias.serviceName) {
    const probe = alias.serviceName.toLowerCase();
    if (siteHost.includes(probe) || probe.includes(siteHost.split(".")[0] ?? "")) {
      score += 15;
    }
  }

  if (alias.type === "email") {
    const domain = alias.value.split("@")[1]?.toLowerCase();
    if (domain && siteHost.includes(domain.replace(/\./g, ""))) score += 5;
  }

  if (alias.healthStatus === "healthy") score += 20;
  else if (alias.healthStatus === "warning") score -= 10;
  else score -= 40;

  return score;
}

/** Picks the best existing alias for the current site before generating a new one. */
export function pickAliasForSite(
  siteHostname: string,
  aliases: readonly AliasSiteMatchCandidate[],
  preferredType: AliasType
): AliasSiteMatchCandidate | null {
  const siteHost = normalizeHostname(siteHostname);
  if (!siteHost) return null;

  const inferred = inferAliasCategory(`https://${siteHost}`);
  const candidates = aliases.filter((a) => a.isActive && a.type === preferredType);

  let best: AliasSiteMatchCandidate | null = null;
  let bestScore = 0;

  for (const alias of candidates) {
    const score = scoreAliasForSite(alias, siteHost, inferred);
    if (score > bestScore) {
      bestScore = score;
      best = alias;
    }
  }

  return bestScore >= 40 ? best : null;
}
