import { computeRiskTrendSeries } from "./riskTrendSeries.js";
import { prisma } from "./prisma.js";

/** Persists missing weekly RiskSnapshot rows from computed trend (Brain backfill). */
export async function backfillRiskSnapshots(userId: string): Promise<number> {
  const series = await computeRiskTrendSeries(userId);
  let written = 0;

  for (const point of series) {
    const existing = await prisma.riskSnapshot.findUnique({
      where: {
        userId_weekEnding: { userId, weekEnding: point.weekEnding },
      },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.riskSnapshot.create({
      data: {
        userId,
        weekEnding: point.weekEnding,
        score: point.score,
      },
    });
    written += 1;
  }

  return written;
}
