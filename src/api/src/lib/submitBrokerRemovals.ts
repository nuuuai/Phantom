import { prisma } from "./prisma.js";
import { isPaidTier } from "./userTierPaid.js";

export type SubmitBrokerRemovalsResult =
  | { ok: true; count: number; scanId: string }
  | { ok: false; code: "not_paid" | "no_scan" | "none_found"; message: string };

/** Submits opt-out for all `found` listings on the user's latest scan. */
export async function submitBrokerRemovalsForUser(
  userId: string
): Promise<SubmitBrokerRemovalsResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !isPaidTier(user.tier)) {
    return {
      ok: false,
      code: "not_paid",
      message: "Data broker removal is available on Phantom Pro",
    };
  }

  const latest = await prisma.brokerScanRun.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
  if (!latest) {
    return { ok: false, code: "no_scan", message: "Run a broker scan first" };
  }

  const updated = await prisma.brokerScanResult.updateMany({
    where: {
      userId,
      brokerScanRunId: latest.id,
      status: "found",
    },
    data: {
      status: "removal_submitted",
      removalSubmittedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return {
      ok: false,
      code: "none_found",
      message: "No exposed broker listings to submit",
    };
  }

  return { ok: true, count: updated.count, scanId: latest.id };
}
