import type { BrokerScanStartResponse } from "@phantom/shared";
import { Prisma } from "@prisma/client";
import {
  BrokerCatalogEmptyError,
  BrokerScanRateLimitedError,
} from "./brokerScanErrors.js";
import { assertCanStartBrokerScan } from "./brokerScanQuota.js";
import {
  delayMs,
  getBrokerScanConcurrency,
  getBrokerScanWorkerDelayMs,
  mapWithConcurrency,
  randomDelayInRange,
  validateBrokerScanRuntimeConfig,
} from "./brokerScanPipeline.js";
import {
  countLiveProbeBrokers,
  getBrokerScanProviderLabel,
  scanOneBroker,
} from "./brokerScan/brokerScanAdapter.js";
import { resolveBrokerScanSubject } from "./brokerScan/subjectResolver.js";
import { prisma } from "./prisma.js";
import {
  randomTargetFoundFraction,
  selectFoundBrokerIndices,
} from "./brokerScanSimulation.js";

export type StartBrokerScanResult =
  | { ok: true; data: BrokerScanStartResponse }
  | {
      ok: false;
      code:
        | "broker_scan_config_invalid"
        | "broker_catalog_empty"
        | "rate_limited"
        | "unauthorized";
      message: string;
      retryAfterSeconds?: number;
    };

export async function startBrokerScanForUser(
  userId: string
): Promise<StartBrokerScanResult> {
  const cfgOk = validateBrokerScanRuntimeConfig();
  if (!cfgOk.ok) {
    return {
      ok: false,
      code: "broker_scan_config_invalid",
      message: cfgOk.message,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, code: "unauthorized", message: "User not found" };
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
      return {
        ok: false,
        code: "rate_limited",
        message: e.gate.message,
        retryAfterSeconds: e.gate.retryAfterSeconds,
      };
    }
    if (e instanceof BrokerCatalogEmptyError) {
      return {
        ok: false,
        code: "broker_catalog_empty",
        message: "Broker catalog not seeded",
      };
    }
    throw e;
  }

  const subject = await resolveBrokerScanSubject(userId);
  const target = randomTargetFoundFraction(userId);
  const foundIndices = selectFoundBrokerIndices(brokers, userId, target);
  const delayRange = getBrokerScanWorkerDelayMs();
  const scanConcurrency = getBrokerScanConcurrency();
  const liveProbeCount = countLiveProbeBrokers(brokers);

  const createRows = await mapWithConcurrency(
    brokers,
    scanConcurrency,
    async (b, i) => {
      await delayMs(randomDelayInRange(delayRange.min, delayRange.max));
      const probe = await scanOneBroker({
        broker: {
          id: b.id,
          name: b.name,
          domain: b.domain,
          category: b.category,
        },
        userId,
        subject,
        simIsFound: foundIndices.has(i),
      });
      return {
        userId,
        brokerScanRunId: run.id,
        brokerId: b.id,
        dataTypesFound: [...probe.dataTypesFound],
        status: probe.status,
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
      data: { completedAt: new Date(), foundCount },
    });
  });

  return {
    ok: true,
    data: {
      scanId: run.id,
      totalBrokers: brokers.length,
      estimatedTime: Math.max(120, Math.round(brokers.length * 2.4)),
      scanProvider: getBrokerScanProviderLabel(),
      liveProbeCount,
    },
  };
}
