import { prisma } from "./prisma.js";

function chance(p: number): boolean {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0]! / 0xffffffff) < p;
}

/**
 * Phase 1 demo: occasionally confirm removals or flag re-listing on read paths.
 * Never logs PII.
 */
export async function advanceRemovalSimulation(userId: string): Promise<void> {
  const submitted = await prisma.brokerScanResult.findMany({
    where: { userId, status: "removal_submitted" },
  });
  for (const row of submitted) {
    if (chance(0.14)) {
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
    take: 80,
  });
  for (const row of confirmed) {
    if (chance(0.018)) {
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
