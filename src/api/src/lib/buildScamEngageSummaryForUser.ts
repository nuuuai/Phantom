import type { ScamEngagementSummary } from "@phantom/shared";
import { generateScamEngageDemo } from "@phantom/shared";
import { isOverviewDemoMetricsEnabled } from "./envOverviewDemo.js";
import { prisma } from "./prisma.js";

/** Demo SEE sessions enriched with Autopilot FTC complaint queue status. */
export async function buildScamEngageSummaryForUser(
  userId: string
): Promise<ScamEngagementSummary> {
  const demo = isOverviewDemoMetricsEnabled();
  const summary = generateScamEngageDemo(userId, demo);

  if (!demo) return summary;

  const queued = await prisma.autopilotActionLog.findMany({
    where: { userId, kind: "ftc_complaint_queued" },
    select: { refId: true },
    orderBy: { createdAt: "desc" },
    take: 32,
  });

  const queuedIds = new Set(
    queued.map((row) => row.refId).filter((id): id is string => id !== null)
  );

  const sessions = summary.sessions.map((session) => ({
    ...session,
    autopilotComplaintQueued:
      queuedIds.has(session.id) && !session.complaintFiled,
  }));

  const autopilotQueuedCount = sessions.filter(
    (s) => s.autopilotComplaintQueued
  ).length;

  return {
    ...summary,
    sessions,
    autopilotComplaintsQueued: autopilotQueuedCount,
  };
}
