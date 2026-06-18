import type { AutopilotActionRecord } from "@phantom/shared";
import { prisma } from "./prisma.js";

export async function listAutopilotActionsForUser(
  userId: string,
  limit = 20
): Promise<readonly AutopilotActionRecord[]> {
  const rows = await prisma.autopilotActionLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
    select: {
      id: true,
      kind: true,
      title: true,
      description: true,
      refId: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    refId: row.refId,
    createdAt: row.createdAt.toISOString(),
  }));
}
