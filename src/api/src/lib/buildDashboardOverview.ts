import type { ActivityItem, DashboardOverview } from "@phantom/shared";
import { prisma } from "./prisma.js";
import { advanceRemovalSimulation } from "./brokerScanAdvance.js";
import { computeBrokerScanSummaryFromRows } from "./computeBrokerScanSummary.js";

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

  const filler: ActivityItem[] = [
    {
      type: "sword",
      label: "Scam engaged",
      desc: "IRS scam · Confused Retiree persona · 23 min",
      time: "2m",
    },
    {
      type: "brain",
      label: "Breach detected",
      desc: "Email alias found in LinkedIn data breach",
      time: "3h",
    },
    {
      type: "shield",
      label: "Call screened",
      desc: "Unknown caller identified as FedEx — forwarded",
      time: "4h",
    },
  ];

  const activity = [...brokerActivity, ...filler].slice(0, 8);

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

  return {
    userId,
    riskScore,
    riskTrend: -12,
    activeAliases,
    aliasesHealthy,
    aliasesWarning,
    aliasesCompromised,
    brokersFound: brokerSummary.exposureCount,
    brokersRemoved: brokerSummary.removed,
    brokersPending: brokerSummary.pending,
    brokersRelisted: brokerSummary.relisted,
    callsScreened: 1284,
    scamsEngaged: 342,
    scammerMinutes: 4870,
    complaintsFile: 298,
    darkWebAlerts: 3,
    activity,
    weeklyScams: [12, 18, 9, 24, 15, 21, 14],
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    systemLayers: [
      { name: "Shield", status: "Broker & alias posture", layer: "shield" },
      { name: "Brain", status: "Risk model updated 2h ago", layer: "brain" },
      { name: "Sword", status: "342 scammers engaged", layer: "sword" },
      { name: "Autopilot", status: "3 auto-actions today", layer: "autopilot" },
    ],
  };
}
