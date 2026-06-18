import type { AliasType, HealthStatus } from "../types/alias.js";
import type {
  AliasRelationshipEdge,
  AliasRelationshipMap,
  AliasRelationshipNode,
} from "../types/aliasRelationship.js";

export interface AliasRelationshipInput {
  aliasId: string;
  label: string;
  type: AliasType;
  healthStatus: HealthStatus;
  serviceUrl: string | null;
  serviceName: string | null;
}

function domainFromUrl(url: string | null): string | null {
  if (!url?.trim()) return null;
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Groups aliases by service domain/name — no alias values or passwords. */
export function buildAliasRelationshipMap(
  aliases: readonly AliasRelationshipInput[],
  passwordVaultCount: number
): AliasRelationshipMap {
  const nodes: AliasRelationshipNode[] = aliases
    .filter((a) => a.type !== "password")
    .map((a) => ({
      aliasId: a.aliasId,
      label: a.label,
      type: a.type,
      healthStatus: a.healthStatus,
      domain: domainFromUrl(a.serviceUrl),
    }));

  const edges: AliasRelationshipEdge[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const inputA = aliases.find((x) => x.aliasId === a.aliasId);
      const inputB = aliases.find((x) => x.aliasId === b.aliasId);
      if (!inputA || !inputB) continue;

      const sameDomain =
        a.domain !== null && b.domain !== null && a.domain === b.domain;
      const sameService =
        inputA.serviceName !== null &&
        inputB.serviceName !== null &&
        inputA.serviceName.toLowerCase() === inputB.serviceName.toLowerCase();

      if (!sameDomain && !sameService) continue;

      const kind = sameDomain ? "same_domain" : "same_service";
      const key = [a.aliasId, b.aliasId].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ fromId: a.aliasId, toId: b.aliasId, kind });
    }
  }

  const parent = new Map<string, string>();
  function find(id: string): string {
    const p = parent.get(id);
    if (!p || p === id) return id;
    const root = find(p);
    parent.set(id, root);
    return root;
  }
  function unite(a: string, b: string): void {
    parent.set(find(a), find(b));
  }
  for (const n of nodes) parent.set(n.aliasId, n.aliasId);
  for (const e of edges) unite(e.fromId, e.toId);

  const clusters = new Set(nodes.map((n) => find(n.aliasId)));

  return {
    nodes,
    edges,
    passwordVaultCount,
    clusterCount: clusters.size,
  };
}
