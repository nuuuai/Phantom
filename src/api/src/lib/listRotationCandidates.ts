import type { AliasType, HealthStatus } from "@phantom/shared";
import type { AliasRotationCandidatesSummary } from "@phantom/shared";
import {
  computeAliasHealthScore,
  rankAliasesForRotation,
} from "@phantom/shared";
import { prisma } from "./prisma.js";

export async function listRotationCandidatesForUser(
  userId: string
): Promise<AliasRotationCandidatesSummary> {
  const rows = await prisma.alias.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      type: true,
      serviceName: true,
      category: true,
      healthStatus: true,
      spamCount: true,
      lastActivityAt: true,
    },
  });

  const inputs = rows.map((row) => ({
    aliasId: row.id,
    label: row.serviceName ?? row.category,
    type: row.type as AliasType,
    healthStatus: row.healthStatus,
    healthScore: computeAliasHealthScore({
      healthStatus: row.healthStatus,
      spamCount: row.spamCount,
      lastActivityAt: row.lastActivityAt?.toISOString() ?? null,
    }),
    spamCount: row.spamCount,
  }));

  const candidates = rankAliasesForRotation(inputs);
  return { candidates, totalEligible: inputs.filter((i) => i.type !== "password").length };
}
