import type { ActivityItem, DashboardOverview } from "@phantom/shared";
import { prisma } from "./prisma.js";
import { advanceRemovalSimulation } from "./brokerScanAdvance.js";
import { computeBrokerScanSummaryFromRows } from "./computeBrokerScanSummary.js";
import { isOverviewDemoMetricsEnabled } from "./envOverviewDemo.js";
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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const aliases = await prisma.alias.findMany({
    where: { userId, isActive: true },
    select: { id: true, healthStatus: true },
  });
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

  const activity = [...brokerActivity, ...darkWebActivity].slice(0, 8);

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

  const riskScore = Math.min(
    92,
    Math.max(
      12,
      22 +
        brokerSummary.exposureCount +
        aliasesCompromised * 3 -
        Math.floor(brokerSummary.removed / 4)
    )
  );

  const demo = isOverviewDemoMetricsEnabled();

  const callsScreened = demo ? 1284 : 0;
  const scamsEngaged = demo ? 342 : 0;
  const scammerMinutes = demo ? 4870 : 0;
  const complaintsFile = demo ? 298 : 0;
  const weeklyScams = demo
    ? ([12, 18, 9, 24, 15, 21, 14] as const)
    : ([0, 0, 0, 0, 0, 0, 0] as const);
  const riskTrend = demo ? -12 : 0;

  const systemLayers = demo
    ? ([
        { name: "Shield", status: "Broker & alias posture", layer: "shield" as const },
        { name: "Brain", status: "Risk model updated 2h ago", layer: "brain" as const },
        { name: "Sword", status: "342 scammers engaged", layer: "sword" as const },
        { name: "Autopilot", status: "3 auto-actions today", layer: "autopilot" as const },
      ] as const)
    : ([
        { name: "Shield", status: "Broker & alias posture", layer: "shield" as const },
        { name: "Brain", status: "Risk model (Phase 2)", layer: "brain" as const },
        { name: "Sword", status: "Scam Engage not live — Phase 1", layer: "sword" as const },
        { name: "Autopilot", status: "Automation not live — Phase 1", layer: "autopilot" as const },
      ] as const);

  return {
    userId,
    riskScore,
    riskTrend,
    metricsDemoMode: demo,
    activeAliases,
    aliasesHealthy,
    aliasesWarning,
    aliasesCompromised,
    brokersFound: brokerSummary.exposureCount,
    brokersRemoved: brokerSummary.removed,
    brokersPending: brokerSummary.pending,
    brokersRelisted: brokerSummary.relisted,
    callsScreened,
    scamsEngaged,
    scammerMinutes,
    complaintsFile,
    darkWebAlerts,
    activity,
    weeklyScams: [...weeklyScams],
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    systemLayers: [...systemLayers],
  };
}
