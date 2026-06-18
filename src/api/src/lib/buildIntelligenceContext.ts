import type { DashboardIntelligenceContext } from "@phantom/shared";
import { prisma } from "./prisma.js";
import { computeBrokerScanSummaryFromRows } from "./computeBrokerScanSummary.js";
import { isOverviewDemoMetricsEnabled } from "./envOverviewDemo.js";
import { findBestRotationCandidate } from "./aliasRotate.js";
import { fetchIntelligenceSignals } from "./intelligenceSignals.js";
import { isPaidTier } from "./userTierPaid.js";
import type { UserTier as PrismaUserTier } from "@prisma/client";

function computeRiskScore(input: {
  exposureCount: number;
  aliasesCompromised: number;
  removed: number;
}): number {
  return Math.min(
    92,
    Math.max(
      12,
      22 +
        input.exposureCount +
        input.aliasesCompromised * 3 -
        Math.floor(input.removed / 4)
    )
  );
}

export async function buildIntelligenceContext(
  userId: string
): Promise<DashboardIntelligenceContext & { userTier: PrismaUserTier }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const [aliases, signals, rotationCandidate] = await Promise.all([
    prisma.alias.findMany({
      where: { userId, isActive: true },
      select: { healthStatus: true, type: true },
    }),
    fetchIntelligenceSignals(userId),
    findBestRotationCandidate(userId),
  ]);

  const activeAliases = aliases.length;
  const aliasesHealthy = aliases.filter((a) => a.healthStatus === "healthy").length;
  const aliasesWarning = aliases.filter((a) => a.healthStatus === "warning").length;
  const aliasesCompromised = aliases.filter(
    (a) => a.healthStatus === "compromised" || a.healthStatus === "quarantined"
  ).length;

  const latestRun = await prisma.brokerScanRun.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });

  const brokerRows = latestRun
    ? await prisma.brokerScanResult.findMany({
        where: { userId, brokerScanRunId: latestRun.id },
      })
    : [];
  const brokerSummary = computeBrokerScanSummaryFromRows(brokerRows);

  let darkWebAlerts = 0;
  if (isPaidTier(user.tier)) {
    darkWebAlerts = await prisma.darkWebFinding.count({
      where: {
        userId,
        status: "open",
        severity: { in: ["medium", "high", "critical"] },
      },
    });
  }

  const unreadInbox = await prisma.aliasInboxMessage.count({
    where: { userId, isRead: false },
  });

  const passwordAliasCount = aliases.filter((a) => a.type === "password").length;
  const demo = isOverviewDemoMetricsEnabled();

  const riskScore = computeRiskScore({
    exposureCount: brokerSummary.exposureCount,
    aliasesCompromised,
    removed: brokerSummary.removed,
  });

  return {
    userTier: user.tier,
    activeAliases,
    aliasesHealthy,
    aliasesWarning,
    aliasesCompromised,
    brokersFound: brokerSummary.exposureCount,
    brokersRemoved: brokerSummary.removed,
    brokersPending: brokerSummary.pending,
    brokersRelisted: brokerSummary.relisted,
    darkWebAlerts,
    riskScore,
    hasBrokerScan: latestRun !== null,
    unreadInbox,
    passwordAliasCount,
    isPaidTier: isPaidTier(user.tier),
    metricsDemoMode: demo,
    inboxPhishingCount: signals.inboxPhishingCount,
    inboxSpamCount: signals.inboxSpamCount,
    daysSinceBrokerScan: signals.daysSinceBrokerScan,
    topRelistedBrokerName: signals.topRelistedBrokerName,
    inboxVolumeSpike: signals.inboxVolumeSpike,
    rotationCandidateAliasId: rotationCandidate?.id ?? null,
    aiSensitivity: user.aiSensitivity,
  };
}
