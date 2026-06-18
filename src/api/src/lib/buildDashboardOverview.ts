import type { ActivityItem, DashboardOverview } from "@phantom/shared";
import {
  buildCopilotPrompts,
  buildDailyBrief,
  buildIntelligenceItems,
  buildLiveSystemLayerStatus,
  buildPriorityActions,
  buildRiskFactors,
  buildRiskNarrative,
  buildSyntheticRiskTrendSeries,
  buildThreatHorizon,
  riskTrendFromSeries,
} from "@phantom/shared";
import { prisma } from "./prisma.js";
import { advanceRemovalSimulation } from "./brokerScanAdvance.js";
import { backfillRiskSnapshots } from "./backfillRiskSnapshots.js";
import { buildIntelligenceContext } from "./buildIntelligenceContext.js";
import { isOverviewDemoMetricsEnabled } from "./envOverviewDemo.js";
import { runAutopilotTick } from "./runAutopilotTick.js";
import {
  computeRiskTrendSeries,
  fetchRiskWeekChanges,
} from "./riskTrendSeries.js";
import { fetchAutopilotActivity } from "./fetchAutopilotActivity.js";
import { persistRiskSnapshot } from "./persistRiskSnapshot.js";
import { queueDailyDigestNotification } from "./queueDailyDigestNotification.js";
import { isPaidTier } from "./userTierPaid.js";

function formatRelativeShort(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export async function buildDashboardOverview(
  userId: string
): Promise<DashboardOverview> {
  await advanceRemovalSimulation(userId);
  await runAutopilotTick(userId);
  await queueDailyDigestNotification(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      autopilotAutoRotate: true,
      autopilotAutoQuarantine: true,
      autopilotAutoComplaint: true,
      autopilotAutoRemoval: true,
    },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const brokerEvents = await prisma.brokerScanResult.findMany({
    where: {
      userId,
      status: {
        in: ["removal_submitted", "removal_confirmed", "re_listed"],
      },
    },
    orderBy: { scanDate: "desc" },
    take: 6,
    include: { broker: true },
  });

  const brokerActivity: ActivityItem[] = brokerEvents.map((r) => {
    const name = r.broker.name;
    if (r.status === "removal_confirmed") {
      return {
        type: "shield",
        label: "Broker removed",
        desc: `${name} confirmed removal of your profile`,
        time: formatRelativeShort(r.removalConfirmedAt ?? r.scanDate),
      };
    }
    if (r.status === "re_listed") {
      return {
        type: "autopilot",
        label: "Broker re-listed",
        desc: `${name} re-published your data — re-removal queued`,
        time: formatRelativeShort(r.relistDetectedAt ?? r.scanDate),
      };
    }
    return {
      type: "shield",
      label: "Removal submitted",
      desc: `${name} opt-out requested`,
      time: formatRelativeShort(r.removalSubmittedAt ?? r.scanDate),
    };
  });

  let darkWebActivity: ActivityItem[] = [];
  if (isPaidTier(user.tier)) {
    const dwRows = await prisma.darkWebFinding.findMany({
      where: { userId, status: "open" },
      orderBy: { detectedAt: "desc" },
      take: 6,
    });
    darkWebActivity = dwRows.map((f) => ({
      type: "brain" as const,
      label: "Dark web exposure",
      desc: `${f.breachName ?? f.title} · ${f.identifierDisplay}`,
      time: formatRelativeShort(f.detectedAt),
    }));
  }

  const activity = [
    ...(await fetchAutopilotActivity(userId, 4)),
    ...brokerActivity,
    ...darkWebActivity,
  ].slice(0, 8);

  const demo = isOverviewDemoMetricsEnabled();
  const intelCtx = await buildIntelligenceContext(userId);

  const riskFactors = buildRiskFactors(intelCtx);
  const priorityActions = buildPriorityActions(intelCtx);
  const dailyBrief = buildDailyBrief(intelCtx);
  const intelligence = buildIntelligenceItems(intelCtx);
  const copilotPrompts = buildCopilotPrompts();

  const demoTrendDelta = -12;
  const riskTrendSeries = demo
    ? buildSyntheticRiskTrendSeries(intelCtx.riskScore, demoTrendDelta)
    : await computeRiskTrendSeries(userId);
  const riskTrend = demo
    ? demoTrendDelta
    : riskTrendFromSeries(riskTrendSeries);
  const weekChanges = await fetchRiskWeekChanges(userId, intelCtx);
  const riskNarrative = buildRiskNarrative(intelCtx, weekChanges);

  if (!demo) {
    await persistRiskSnapshot(userId, intelCtx.riskScore);
    await backfillRiskSnapshots(userId);
  }

  const threatHorizon = buildThreatHorizon({
    brokersRelisted: intelCtx.brokersRelisted,
    brokersFound: intelCtx.brokersFound,
    darkWebAlerts: intelCtx.darkWebAlerts,
    hasBrokerScan: intelCtx.hasBrokerScan,
    isPaidTier: intelCtx.isPaidTier,
    daysSinceBrokerScan: intelCtx.daysSinceBrokerScan,
    topRelistedBrokerName: intelCtx.topRelistedBrokerName,
    inboxVolumeSpike: intelCtx.inboxVolumeSpike,
    aliasesCompromised: intelCtx.aliasesCompromised,
    aliasesWarning: intelCtx.aliasesWarning,
  });

  const callsScreened = demo ? 1284 : 0;
  const scamsEngaged = demo ? 342 : 0;
  const scammerMinutes = demo ? 4870 : 0;
  const complaintsFile = demo ? 298 : 0;
  const weeklyScams = demo
    ? ([12, 18, 9, 24, 15, 21, 14] as const)
    : ([0, 0, 0, 0, 0, 0, 0] as const);

  const systemLayers = demo
    ? ([
        { name: "Shield", status: "Broker & alias posture", layer: "shield" as const },
        { name: "Brain", status: "Risk model updated 2h ago", layer: "brain" as const },
        { name: "Sword", status: "342 scammers engaged", layer: "sword" as const },
        { name: "Autopilot", status: "3 auto-actions today", layer: "autopilot" as const },
      ] as const)
    : buildLiveSystemLayerStatus({
        activeAliases: intelCtx.activeAliases,
        aliasesHealthy: intelCtx.aliasesHealthy,
        brokersFound: intelCtx.brokersFound,
        brokersRemoved: intelCtx.brokersRemoved,
        brokersPending: intelCtx.brokersPending,
        riskScore: intelCtx.riskScore,
        intelligenceCount: intelligence.length,
        darkWebAlerts: intelCtx.darkWebAlerts,
        unreadInbox: intelCtx.unreadInbox,
        hasBrokerScan: intelCtx.hasBrokerScan,
        autopilotAutoRotate: user?.autopilotAutoRotate ?? false,
        autopilotAutoQuarantine: user?.autopilotAutoQuarantine ?? false,
        autopilotAutoComplaint: user?.autopilotAutoComplaint ?? false,
        autopilotAutoRemoval: user?.autopilotAutoRemoval ?? false,
      });

  return {
    userId,
    riskScore: intelCtx.riskScore,
    riskTrend,
    riskTrendSeries,
    riskNarrative,
    metricsDemoMode: demo,
    activeAliases: intelCtx.activeAliases,
    aliasesHealthy: intelCtx.aliasesHealthy,
    aliasesWarning: intelCtx.aliasesWarning,
    aliasesCompromised: intelCtx.aliasesCompromised,
    brokersFound: intelCtx.brokersFound,
    brokersRemoved: intelCtx.brokersRemoved,
    brokersPending: intelCtx.brokersPending,
    brokersRelisted: intelCtx.brokersRelisted,
    callsScreened,
    scamsEngaged,
    scammerMinutes,
    complaintsFile,
    darkWebAlerts: intelCtx.darkWebAlerts,
    activity,
    weeklyScams: [...weeklyScams],
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    systemLayers: [...systemLayers],
    dailyBrief,
    riskFactors,
    priorityActions,
    intelligence,
    copilotPrompts,
    unreadInbox: intelCtx.unreadInbox,
    hasBrokerScan: intelCtx.hasBrokerScan,
    passwordAliasCount: intelCtx.passwordAliasCount,
    isPaidTier: intelCtx.isPaidTier,
    threatHorizon,
  };
}
