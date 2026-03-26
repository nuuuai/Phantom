import type { UserTier } from "@prisma/client";

export function isPaidTier(tier: UserTier): boolean {
  return tier === "paid" || tier === "enterprise";
}
