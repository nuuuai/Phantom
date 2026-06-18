import type { AliasRelationshipMap } from "@phantom/shared";
import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

function clusterLabel(map: AliasRelationshipMap): string {
  const linked = map.edges.length;
  if (linked === 0) return "No cross-alias relationships detected yet";
  return `${map.clusterCount} service cluster(s) · ${linked} link(s)`;
}

export function AliasRelationshipPanel() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const brain = LAYER_STYLES.brain;

  const query = useQuery({
    queryKey: queryKeys.aliasRelationshipMap(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.intelligence.relationshipMap(accessToken!, {
        signal,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.aliasRelationshipMap,
  });

  if (!accessToken || query.isPending) return null;
  if (query.isError) {
    return (
      <p className="mt-4 font-sans text-xs text-ph-danger">
        {getQueryErrorMessage(query.error)}
      </p>
    );
  }

  const map = query.data;
  if (!map || map.nodes.length === 0) return null;

  const linkedIds = new Set<string>();
  for (const edge of map.edges) {
    linkedIds.add(edge.fromId);
    linkedIds.add(edge.toId);
  }

  const highlighted = map.nodes.filter((n) => linkedIds.has(n.aliasId));

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-ph-border bg-ph-surface">
      <div className="border-b border-ph-border-subtle px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded border px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: brain.text, backgroundColor: brain.bg, borderColor: brain.border }}
          >
            Brain
          </span>
          <h2 className="font-sans text-sm font-semibold text-ph-text-primary">
            Alias relationship map
          </h2>
        </div>
        <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
          {clusterLabel(map)}
          {map.passwordVaultCount > 0
            ? ` · ${map.passwordVaultCount} password alias(es) in vault`
            : ""}
        </p>
      </div>
      {highlighted.length > 0 ? (
        <ul className="divide-y divide-ph-border-subtle">
          {highlighted.map((node) => {
            const links = map.edges.filter(
              (e) => e.fromId === node.aliasId || e.toId === node.aliasId
            ).length;
            return (
              <li key={node.aliasId} className="px-4 py-3">
                <Link
                  to={`/aliases/${node.aliasId}`}
                  className="font-sans text-sm font-medium text-ph-accent-light hover:underline"
                >
                  {node.label}
                </Link>
                <span className="ml-2 font-mono text-[10px] uppercase text-ph-text-ghost">
                  {node.type} · {node.healthStatus}
                </span>
                {node.domain ? (
                  <span className="ml-2 font-mono text-[10px] text-ph-text-muted">
                    {node.domain}
                  </span>
                ) : null}
                <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
                  {links} related alias link(s)
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-4 font-sans text-xs text-ph-text-tertiary">
          Add service URLs or names to aliases to surface domain clusters.
        </p>
      )}
    </section>
  );
}
