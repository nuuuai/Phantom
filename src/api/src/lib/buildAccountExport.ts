import type {
  AccountExportPayload,
  AccountExportAliasRow,
} from "@phantom/shared";
import { computeBrokerScanSummaryFromRows } from "./computeBrokerScanSummary.js";
import {
  mapUserPreferences,
  USER_AI_PREFERENCES_SELECT,
} from "./mapUserPreferences.js";
import { prisma } from "./prisma.js";
import { toPublicUser } from "./userPublic.js";

export async function buildAccountExport(
  userId: string
): Promise<AccountExportPayload | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      tier: true,
      forwardToEmail: true,
      subscriptionStatus: true,
      vaultSyncCiphertext: true,
      vaultSyncVersion: true,
      ...USER_AI_PREFERENCES_SELECT,
    },
  });
  if (!row) return null;

  const aliases = await prisma.alias.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      category: true,
      healthStatus: true,
      serviceName: true,
      serviceUrl: true,
      value: true,
      encryptedValue: true,
      createdAt: true,
    },
  });

  const aliasRows: AccountExportAliasRow[] = aliases.map((a) => ({
    id: a.id,
    type: a.type,
    category: a.category,
    healthStatus: a.healthStatus,
    serviceName: a.serviceName,
    serviceUrl: a.serviceUrl,
    value: a.value,
    createdAt: a.createdAt.toISOString(),
    hasEncryptedValue: Boolean(a.encryptedValue),
  }));

  const darkWebOpenCount = await prisma.darkWebFinding.count({
    where: { userId, status: "open" },
  });

  const latestRun = await prisma.brokerScanRun.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });

  let brokerExposureCount: number | null = null;
  if (latestRun) {
    const brokerRows = await prisma.brokerScanResult.findMany({
      where: { userId, brokerScanRunId: latestRun.id },
    });
    brokerExposureCount = computeBrokerScanSummaryFromRows(brokerRows).exposureCount;
  }

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    user: toPublicUser(row),
    preferences: mapUserPreferences(row),
    aliases: aliasRows,
    darkWebOpenCount,
    brokerExposureCount,
    vaultSyncVersion: row.vaultSyncVersion,
    vaultSyncCiphertext: row.vaultSyncCiphertext,
  };
}
