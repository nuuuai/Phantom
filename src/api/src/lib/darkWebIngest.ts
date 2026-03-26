import type { DarkWebSeverity } from "@prisma/client";
import { prisma } from "./prisma.js";

export function notificationPriorityForSeverity(
  s: DarkWebSeverity
): "critical" | "high" | "medium" | "low" {
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  return "low";
}

/**
 * Insert a finding and a bell notification (writers do not check prefs; read path filters).
 */
export async function insertDarkWebFindingWithNotification(input: {
  userId: string;
  severity: DarkWebSeverity;
  title: string;
  summary: string;
  sourceLabel: string;
  breachName: string | null;
  identifierType: string;
  identifierDisplay: string;
  recommendedAction: string;
  detectedAt: Date;
  dedupeKey: string;
}): Promise<{ created: boolean; id: string }> {
  const existing = await prisma.darkWebFinding.findFirst({
    where: { userId: input.userId, dedupeKey: input.dedupeKey },
  });
  if (existing) {
    return { created: false, id: existing.id };
  }

  const row = await prisma.darkWebFinding.create({
    data: {
      userId: input.userId,
      severity: input.severity,
      status: "open",
      title: input.title,
      summary: input.summary,
      sourceLabel: input.sourceLabel,
      breachName: input.breachName,
      identifierType: input.identifierType,
      identifierDisplay: input.identifierDisplay,
      recommendedAction: input.recommendedAction,
      detectedAt: input.detectedAt,
      dedupeKey: input.dedupeKey,
    },
  });

  const preview = input.summary.length > 280 ? `${input.summary.slice(0, 277)}…` : input.summary;

  await prisma.notification.create({
    data: {
      userId: input.userId,
      layer: "brain",
      priority: notificationPriorityForSeverity(input.severity),
      category: "security_alert",
      title: input.title,
      body: preview,
      linkTo: "/dark-web",
    },
  });

  return { created: true, id: row.id };
}
