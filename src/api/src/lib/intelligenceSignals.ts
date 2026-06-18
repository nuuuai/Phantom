import type { InboxVolumeSpikeSignal } from "@phantom/shared";
import { classifyInboxMessage } from "@phantom/shared";
import { prisma } from "./prisma.js";

export interface IntelligenceSignalExtras {
  inboxPhishingCount: number;
  inboxSpamCount: number;
  daysSinceBrokerScan: number | null;
  topRelistedBrokerName: string | null;
  inboxVolumeSpike: InboxVolumeSpikeSignal | null;
}

export async function fetchIntelligenceSignals(
  userId: string
): Promise<IntelligenceSignalExtras> {
  const rows = await prisma.aliasInboxMessage.findMany({
    where: { userId },
    orderBy: { receivedAt: "desc" },
    take: 200,
    select: {
      id: true,
      subject: true,
      fromAddress: true,
      snippet: true,
      aliasId: true,
      receivedAt: true,
    },
  });

  let inboxPhishingCount = 0;
  let inboxSpamCount = 0;
  for (const r of rows) {
    const c = classifyInboxMessage({
      messageId: r.id,
      subject: r.subject,
      fromAddress: r.fromAddress,
      snippet: r.snippet,
    });
    if (c.category === "phishing") inboxPhishingCount += 1;
    if (c.category === "spam") inboxSpamCount += 1;
  }

  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86_400_000);
  const twoWeeksAgo = new Date(now - 14 * 86_400_000);

  const emailAliases = await prisma.alias.findMany({
    where: { userId, isActive: true, type: "email" },
    select: { id: true, category: true, serviceName: true },
  });

  const aliasMeta = new Map(
    emailAliases.map((a) => [
      a.id,
      {
        serviceLabel: a.serviceName ?? a.category,
        category: a.category,
      },
    ])
  );

  const [recentGroups, priorGroups] = await Promise.all([
    prisma.aliasInboxMessage.groupBy({
      by: ["aliasId"],
      where: { userId, receivedAt: { gte: weekAgo } },
      _count: { id: true },
    }),
    prisma.aliasInboxMessage.groupBy({
      by: ["aliasId"],
      where: { userId, receivedAt: { gte: twoWeeksAgo, lt: weekAgo } },
      _count: { id: true },
    }),
  ]);

  const priorByAlias = new Map(
    priorGroups.map((g) => [g.aliasId, g._count.id])
  );

  let inboxVolumeSpike: InboxVolumeSpikeSignal | null = null;
  for (const g of recentGroups) {
    const meta = aliasMeta.get(g.aliasId);
    if (!meta) continue;
    const recent = g._count.id;
    const prior = priorByAlias.get(g.aliasId) ?? 0;
    const baseline = Math.max(prior, 1);
    const multiplier = recent / baseline;
    if (recent >= 3 && multiplier >= 2.5) {
      const rounded = Math.round(multiplier * 10) / 10;
      if (!inboxVolumeSpike || rounded > inboxVolumeSpike.multiplier) {
        inboxVolumeSpike = {
          aliasId: g.aliasId,
          serviceLabel: meta.serviceLabel,
          category: meta.category,
          multiplier: rounded,
        };
      }
    }
  }

  const latestRun = await prisma.brokerScanRun.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true },
  });

  const daysSinceBrokerScan = latestRun
    ? Math.floor((now - latestRun.startedAt.getTime()) / 86_400_000)
    : null;

  const relisted = await prisma.brokerScanResult.findFirst({
    where: { userId, status: "re_listed" },
    orderBy: { relistDetectedAt: "desc" },
    include: { broker: { select: { name: true } } },
  });

  return {
    inboxPhishingCount,
    inboxSpamCount,
    daysSinceBrokerScan,
    topRelistedBrokerName: relisted?.broker.name ?? null,
    inboxVolumeSpike,
  };
}
