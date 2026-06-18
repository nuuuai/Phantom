import { prisma } from "./prisma.js";

function currentWeekEnding(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** Upserts the current week's risk score snapshot (Brain trend accuracy). */
export async function persistRiskSnapshot(
  userId: string,
  score: number
): Promise<void> {
  const weekEnding = currentWeekEnding();
  await prisma.riskSnapshot.upsert({
    where: { userId_weekEnding: { userId, weekEnding } },
    create: { userId, score, weekEnding },
    update: { score, capturedAt: new Date() },
  });
}
