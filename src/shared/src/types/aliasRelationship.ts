import type { AliasType, HealthStatus } from "./alias.js";

export type AliasRelationshipEdgeKind = "same_domain" | "same_service";

export interface AliasRelationshipNode {
  aliasId: string;
  label: string;
  type: AliasType;
  healthStatus: HealthStatus;
  domain: string | null;
}

export interface AliasRelationshipEdge {
  fromId: string;
  toId: string;
  kind: AliasRelationshipEdgeKind;
}

export interface AliasRelationshipMap {
  nodes: readonly AliasRelationshipNode[];
  edges: readonly AliasRelationshipEdge[];
  passwordVaultCount: number;
  clusterCount: number;
}
