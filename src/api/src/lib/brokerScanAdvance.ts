import { prisma } from "./prisma.js";
import {
  confirmationProbabilityForBroker,
  relistProbabilityForBroker,
} from "./brokerRemovalPipeline.js";

function chance(p: number): boolean {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0]! / 0xffffffff) < p;
}

/**
 * Phase 1: occasionally confirm removals or flag re-listing on read paths.
 * Probabilities derive from broker removalMethod and avgRemovalDays (see brokerRemovalPipeline).
 * Never logs PII.
 */
export async function advanceRemovalSimulation(userId: string): Promise<void> {
  const submitted = await prisma.brokerScanResult.findMany({
    where: { userId, status: "removal_submitted" },
    include: { broker: true },
  });
  for (const row of submitted) {
    const p = confirmationProbabilityForBroker(
      row.broker.removalMethod,
      row.broker.avgRemovalDays
    );
    if (chance(p)) {
      await prisma.brokerScanResult.update({
        where: { id: row.id },
        data: {
          status: "removal_confirmed",
          removalConfirmedAt: new Date(),
        },
      });
    }
  }

  const confirmed = await prisma.brokerScanResult.findMany({
    where: { userId, status: "removal_confirmed" },
    include: { broker: true },
    take: 80,
  });
  for (const row of confirmed) {
    const p = relistProbabilityForBroker(row.broker.avgRemovalDays);
    if (chance(p)) {
      await prisma.brokerScanResult.update({
        where: { id: row.id },
        data: {
          status: "re_listed",
          relistDetectedAt: new Date(),
        },
      });
    }
  }
}
