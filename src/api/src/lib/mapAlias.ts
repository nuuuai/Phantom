import type { Alias as PrismaAliasRow } from "@prisma/client";
import type { Alias } from "@phantom/shared";

export function mapAliasToDto(row: PrismaAliasRow): Alias {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    value: row.value,
    encryptedValue: row.encryptedValue,
    category: row.category,
    serviceName: row.serviceName,
    serviceUrl: row.serviceUrl,
    healthStatus: row.healthStatus,
    createdAt: row.createdAt.toISOString(),
    lastActivityAt: row.lastActivityAt?.toISOString() ?? null,
    spamCount: row.spamCount,
    isActive: row.isActive,
  };
}
