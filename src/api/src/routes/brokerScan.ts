import type {
  ApiResponse,
  BrokerScanResult,
  BrokerScanStartResponse,
  BrokerScanSummary,
} from "@phantom/shared";
import { Router } from "express";
import type { BrokerScanStatus, UserTier } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { advanceRemovalSimulation } from "../lib/brokerScanAdvance.js";
import { delayMs, mapWithConcurrency } from "../lib/brokerScanPipeline.js";
import { computeBrokerScanSummaryFromRows } from "../lib/computeBrokerScanSummary.js";
import { mapBroker, mapBrokerScanResult } from "../lib/mapBrokerScan.js";
import {
  randomTargetFoundFraction,
  selectFoundBrokerIndices,
  simulateOneBroker,
} from "../lib/brokerScanSimulation.js";

/** Simulated parallel workers (bounded concurrency + per-broker delay). */
const SCAN_CONCURRENCY = 8;

export const brokerScanRouter = Router();

function isPaidTier(tier: UserTier): boolean {
  return tier === "paid" || tier === "enterprise";
}

function parseStatusFilter(
  raw: string | undefined
): BrokerScanStatus | undefined {
  if (!raw) return undefined;
  if (raw === "found") return "found";
  if (raw === "not_found") return "not_found";
  if (raw === "removal_submitted" || raw === "pending")
    return "removal_submitted";
  if (raw === "removal_confirmed" || raw === "removed")
    return "removal_confirmed";
  if (raw === "re_listed" || raw === "relisted") return "re_listed";
  return undefined;
}

brokerScanRouter.get("/catalog", async (_req, res) => {
  const brokers = await prisma.dataBroker.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  const response: ApiResponse<{ items: ReturnType<typeof mapBroker>[] }> = {
    ok: true,
    data: { items: brokers.map(mapBroker) },
  };
  res.json(response);
});

brokerScanRouter.post("/start", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const brokers = await prisma.dataBroker.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  if (brokers.length === 0) {
    res.status(503).json({
      ok: false,
      error: {
        code: "broker_catalog_empty",
        message: "Broker catalog not seeded",
      },
    });
    return;
  }

  await prisma.brokerScanRun.deleteMany({ where: { userId } });

  const target = randomTargetFoundFraction(userId);
  const foundIndices = selectFoundBrokerIndices(brokers, userId, target);

  const run = await prisma.brokerScanRun.create({
    data: {
      userId,
      totalBrokers: brokers.length,
      foundCount: 0,
    },
  });

  const createRows = await mapWithConcurrency(
    brokers,
    SCAN_CONCURRENCY,
    async (b, i) => {
      await delayMs(5 + Math.floor(Math.random() * 20));
      const isFound = foundIndices.has(i);
      const sim = simulateOneBroker(b, userId, isFound);
      return {
        userId,
        brokerScanRunId: run.id,
        brokerId: b.id,
        dataTypesFound: [...sim.dataTypesFound],
        status: sim.status,
      };
    }
  );

  let foundCount = 0;
  for (const row of createRows) {
    if (row.status === "found") foundCount += 1;
  }

  await prisma.brokerScanResult.createMany({ data: createRows });

  await prisma.brokerScanRun.update({
    where: { id: run.id },
    data: {
      completedAt: new Date(),
      foundCount,
    },
  });

  const estimatedTime = Math.max(120, Math.round(brokers.length * 2.4));
  const data: BrokerScanStartResponse = {
    scanId: run.id,
    totalBrokers: brokers.length,
    estimatedTime,
  };
  const response: ApiResponse<BrokerScanStartResponse> = { ok: true, data };
  res.status(201).json(response);
});

brokerScanRouter.get("/summary", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  await advanceRemovalSimulation(userId);

  const latest = await prisma.brokerScanRun.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
  if (!latest) {
    const empty = computeBrokerScanSummaryFromRows([]);
    const response: ApiResponse<BrokerScanSummary> = { ok: true, data: empty };
    res.json(response);
    return;
  }

  const rows = await prisma.brokerScanResult.findMany({
    where: { userId, brokerScanRunId: latest.id },
  });
  const summary = computeBrokerScanSummaryFromRows(rows);
  const response: ApiResponse<BrokerScanSummary> = { ok: true, data: summary };
  res.json(response);
});

brokerScanRouter.get("/results", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  await advanceRemovalSimulation(userId);

  const latest = await prisma.brokerScanRun.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
  if (!latest) {
    const response: ApiResponse<{ userId: string; items: BrokerScanResult[] }> =
      {
        ok: true,
        data: { userId, items: [] },
      };
    res.json(response);
    return;
  }

  const statusFilter = parseStatusFilter(
    typeof req.query.status === "string" ? req.query.status : undefined
  );
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const rows = await prisma.brokerScanResult.findMany({
    where: {
      userId,
      brokerScanRunId: latest.id,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q.length > 0
        ? {
            broker: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { domain: { contains: q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: { broker: true },
    orderBy: { broker: { name: "asc" } },
  });

  const items = rows.map(mapBrokerScanResult);
  const response: ApiResponse<{ userId: string; items: BrokerScanResult[] }> = {
    ok: true,
    data: { userId, items },
  };
  res.json(response);
});

brokerScanRouter.post("/remove-all", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !isPaidTier(user.tier)) {
    res.status(403).json({
      ok: false,
      error: {
        code: "upgrade_required",
        message: "Data broker removal is available on Phantom Pro",
      },
    });
    return;
  }

  const latest = await prisma.brokerScanRun.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
  if (!latest) {
    res.status(400).json({
      ok: false,
      error: { code: "no_scan", message: "Run a scan first" },
    });
    return;
  }

  const now = new Date();
  const updated = await prisma.brokerScanResult.updateMany({
    where: {
      userId,
      brokerScanRunId: latest.id,
      status: "found",
    },
    data: {
      status: "removal_submitted",
      removalSubmittedAt: now,
    },
  });

  const response: ApiResponse<{ updated: number }> = {
    ok: true,
    data: { updated: updated.count },
  };
  res.json(response);
});

brokerScanRouter.post("/:resultId/request-removal", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !isPaidTier(user.tier)) {
    res.status(403).json({
      ok: false,
      error: {
        code: "upgrade_required",
        message: "Data broker removal is available on Phantom Pro",
      },
    });
    return;
  }

  const resultId =
    typeof req.params.resultId === "string" ? req.params.resultId : "";
  const row = await prisma.brokerScanResult.findFirst({
    where: { id: resultId, userId },
    include: { broker: true },
  });
  if (!row) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Scan result not found" },
    });
    return;
  }

  if (row.status !== "found" && row.status !== "re_listed") {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_status",
        message: "Removal can only be requested for exposed or re-listed brokers",
      },
    });
    return;
  }

  const now = new Date();
  const updated = await prisma.brokerScanResult.update({
    where: { id: row.id },
    data: {
      status: "removal_submitted",
      removalSubmittedAt: now,
    },
    include: { broker: true },
  });

  const response: ApiResponse<{ result: BrokerScanResult }> = {
    ok: true,
    data: { result: mapBrokerScanResult(updated) },
  };
  res.json(response);
});
