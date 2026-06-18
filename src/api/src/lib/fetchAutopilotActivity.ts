import type { ActivityItem } from "@phantom/shared";
import { prisma } from "./prisma.js";

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

export async function fetchAutopilotActivity(
  userId: string,
  limit = 6
): Promise<ActivityItem[]> {
  const rows = await prisma.autopilotActionLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    type: "autopilot" as const,
    label: row.title,
    desc: row.description,
    time: formatRelativeShort(row.createdAt),
  }));
}
