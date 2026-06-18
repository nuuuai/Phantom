import type { AliasRelationshipMap } from "@phantom/shared";
import { buildAliasRelationshipMap } from "@phantom/shared";
import { prisma } from "./prisma.js";

export async function listAliasRelationshipMapForUser(
  userId: string
): Promise<AliasRelationshipMap> {
  const rows = await prisma.alias.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      type: true,
      healthStatus: true,
      serviceUrl: true,
      serviceName: true,
      category: true,
    },
  });

  const passwordVaultCount = rows.filter((r) => r.type === "password").length;

  return buildAliasRelationshipMap(
    rows.map((row) => ({
      aliasId: row.id,
      label: row.serviceName ?? row.category,
      type: row.type,
      healthStatus: row.healthStatus,
      serviceUrl: row.serviceUrl,
      serviceName: row.serviceName,
    })),
    passwordVaultCount
  );
}
