import type { AliasType, HealthStatus } from "./alias.js";

export interface AliasRotationCandidate {
  aliasId: string;
  label: string;
  type: AliasType;
  healthStatus: HealthStatus;
  healthScore: number;
  priorityRank: number;
  reason: string;
}

export interface AliasRotationCandidatesSummary {
  candidates: readonly AliasRotationCandidate[];
  totalEligible: number;
}
