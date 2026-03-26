import type {
  ApiResponse,
  BrokerScanResult,
  BrokerScanStartResponse,
  BrokerScanSummary,
} from "@phantom/shared";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import type { BrokerScanStatus } from "@prisma/client";
import {
  BrokerCatalogEmptyError,
  BrokerScanRateLimitedError,
} from "../lib/brokerScanErrors.js";
import { assertCanStartBrokerScan } from "../lib/brokerScanQuota.js";
import { isPaidTier } from "../lib/userTierPaid.js";
import { prisma } from "../lib/prisma.js";
import { advanceRemovalSimulation } from "../lib/brokerScanAdvance.js";
import {
  delayMs,
  getBrokerScanConcurrency,
  getBrokerScanWorkerDelayMs,
  mapWithConcurrency,
  randomDelayInRange,
} from "../lib/brokerScanPipeline.js";
import { augmentBrokerScanSummary } from "../lib/brokerScanSummaryAugment.js";
import { computeBrokerScanSummaryFromRows } from "../lib/computeBrokerScanSummary.js";
import { mapBroker, mapBrokerScanResult } from "../lib/mapBrokerScan.js";
import {
  randomTargetFoundFraction,
  selectFoundBrokerIndices,
  simulateOneBroker,
} from "../lib/brokerScanSimulation.js";

export const brokerScanRouter = Router();

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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  let run: { id: string };
  let brokers: Awaited<ReturnType<typeof prisma.dataBroker.findMany>>;
  try {
    const started = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
      );
      const gate = await assertCanStartBrokerScan(userId, user.tier, tx);
      if (!gate.ok) {
        throw new BrokerScanRateLimitedError(gate);
      }
      const brokerRows = await tx.dataBroker.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
      if (brokerRows.length === 0) {
        throw new BrokerCatalogEmptyError();
      }
      const scanRun = await tx.brokerScanRun.create({
        data: {
          userId,
          totalBrokers: brokerRows.length,
          foundCount: 0,
        },
      });
      return { run: scanRun, brokers: brokerRows };
    });
    run = started.run;
    brokers = started.brokers;
  } catch (e) {
    if (e instanceof BrokerScanRateLimitedError) {
      res.setHeader("Retry-After", String(e.gate.retryAfterSeconds));
      res.status(429).json({
        ok: false,
        error: {
          code: e.gate.code,
          message: e.gate.message,
          retryAfterSeconds: e.gate.retryAfterSeconds,
        },
      });
      return;
    }
    if (e instanceof BrokerCatalogEmptyError) {
      res.status(503).json({
        ok: false,
        error: {
          code: "broker_catalog_empty",
          message: "Broker catalog not seeded",
        },
      });
      return;
    }
    throw e;
  }

  const target = randomTargetFoundFraction(userId);
  const foundIndices = selectFoundBrokerIndices(brokers, userId, target);

  const delayRange = getBrokerScanWorkerDelayMs();
  const scanConcurrency = getBrokerScanConcurrency();
  const createRows = await mapWithConcurrency(
    brokers,
    scanConcurrency,
    async (b, i) => {
      await delayMs(randomDelayInRange(delayRange.min, delayRange.max));
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

  await prisma.$transaction(async (tx) => {
    await tx.brokerScanResult.createMany({ data: createRows });
    await tx.brokerScanRun.update({
      where: { id: run.id },
      data: {
        completedAt: new Date(),
        foundCount,
      },
    });
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

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const latest = await prisma.brokerScanRun.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
  if (!latest) {
    const empty = augmentBrokerScanSummary(
      user,
      computeBrokerScanSummaryFromRows([])
    );
    const response: ApiResponse<BrokerScanSummary> = { ok: true, data: empty };
    res.json(response);
    return;
  }

  const rows = await prisma.brokerScanResult.findMany({
    where: { userId, brokerScanRunId: latest.id },
  });
  const summary = augmentBrokerScanSummary(
    user,
    computeBrokerScanSummaryFromRows(rows)
  );
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
  // Phase 1: `removalMethod === "api"` uses the same simulated pipeline as other methods;
  // real partner API calls are not wired (see docs/roadmap/BROKER_REMOVAL_QUEUE.md).

  const response: ApiResponse<{ result: BrokerScanResult }> = {
    ok: true,
    data: { result: mapBrokerScanResult(updated) },
  };
  res.json(response);
});
