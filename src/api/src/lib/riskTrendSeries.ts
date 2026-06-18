import type { RiskTrendPoint } from "@phantom/shared";
import { computeBrokerScanSummaryFromRows } from "./computeBrokerScanSummary.js";
import { prisma } from "./prisma.js";

function computeRiskScore(input: {
  exposureCount: number;
  aliasesCompromised: number;
  removed: number;
}): number {
  return Math.min(
    92,
    Math.max(
      12,
      22 +
        input.exposureCount +
        input.aliasesCompromised * 3 -
        Math.floor(input.removed / 4)
    )
  );
}

export async function computeRiskTrendSeries(
  userId: string
): Promise<RiskTrendPoint[]> {
  const [runs, aliases] = await Promise.all([
    prisma.brokerScanRun.findMany({
      where: { userId },
      orderBy: { startedAt: "asc" },
      include: { results: true },
    }),
    prisma.alias.findMany({
      where: { userId },
      select: { createdAt: true, healthStatus: true, isActive: true },
    }),
  ]);

  const now = Date.now();
  const points: RiskTrendPoint[] = [];

  for (let w = 12; w >= 0; w--) {
    const weekEndMs = now - w * 7 * 86_400_000;
    const weekEnd = new Date(weekEndMs);

    let run = null as (typeof runs)[number] | null;
    for (let i = runs.length - 1; i >= 0; i--) {
      if (runs[i]!.startedAt.getTime() <= weekEndMs) {
        run = runs[i]!;
        break;
      }
    }

    let exposureCount = 0;
    let removed = 0;
    if (run) {
      const rows = run.results.filter((r) => r.scanDate.getTime() <= weekEndMs);
      const summary = computeBrokerScanSummaryFromRows(rows);
      exposureCount = summary.exposureCount;
      removed = summary.removed;
    }

    const activeAtWeek = aliases.filter(
      (a) => a.createdAt.getTime() <= weekEndMs && a.isActive
    );
    const aliasesCompromised = activeAtWeek.filter(
      (a) =>
        a.healthStatus === "compromised" || a.healthStatus === "quarantined"
    ).length;

    points.push({
      weekEnding: weekEnd.toISOString().slice(0, 10),
      score: computeRiskScore({ exposureCount, aliasesCompromised, removed }),
    });
  }

  return points;
}

export async function fetchRiskWeekChanges(
  userId: string,
  intelCtx: {
    inboxVolumeSpike: {
      serviceLabel: string;
      multiplier: number;
    } | null;
  }
): Promise<string[]> {
  const since = new Date(Date.now() - 7 * 86_400_000);
  const changes: string[] = [];

  const [removals, relisted, scans, darkWeb, newAliases] = await Promise.all([
    prisma.brokerScanResult.count({
      where: { userId, removalConfirmedAt: { gte: since } },
    }),
    prisma.brokerScanResult.count({
      where: { userId, relistDetectedAt: { gte: since } },
    }),
    prisma.brokerScanRun.count({
      where: { userId, startedAt: { gte: since } },
    }),
    prisma.darkWebFinding.count({
      where: { userId, detectedAt: { gte: since }, status: "open" },
    }),
    prisma.alias.count({
      where: { userId, createdAt: { gte: since }, isActive: true },
    }),
  ]);

  if (removals > 0) {
    changes.push(
      `${removals} broker removal${removals === 1 ? "" : "s"} confirmed this week.`
    );
  }
  if (relisted > 0) {
    changes.push(
      `${relisted} broker re-listing${relisted === 1 ? "" : "s"} detected.`
    );
  }
  if (scans > 0) {
    changes.push(
      `${scans} broker scan${scans === 1 ? "" : "s"} completed this week.`
    );
  }
  if (darkWeb > 0) {
    changes.push(
      `${darkWeb} new dark web exposure${darkWeb === 1 ? "" : "s"} flagged.`
    );
  }
  if (newAliases > 0) {
    changes.push(
      `${newAliases} new alias${newAliases === 1 ? "" : "es"} added to your shield.`
    );
  }
  if (intelCtx.inboxVolumeSpike) {
    const s = intelCtx.inboxVolumeSpike;
    changes.push(
      `${s.serviceLabel} inbox volume hit ${s.multiplier}× its prior-week baseline.`
    );
  }

  if (changes.length === 0) {
    changes.push(
      "No major posture shifts this week — maintain monitoring cadence."
    );
  }

  return changes.slice(0, 4);
}
