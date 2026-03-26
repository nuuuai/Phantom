import type { AliasType } from "@prisma/client";
import type { UserTier } from "@prisma/client";
import type { AliasTypeUsage } from "@phantom/shared";
import { FREE_TIER_ALIAS_MAX } from "@phantom/shared";
import { prisma } from "./prisma.js";

const TYPES: AliasType[] = ["email", "phone", "username", "password"];

export async function buildAliasUsage(
  userId: string,
  tier: UserTier
): Promise<AliasTypeUsage[]> {
  const results: AliasTypeUsage[] = [];
  for (const type of TYPES) {
    const used = await prisma.alias.count({
      where: { userId, type, isActive: true },
    });
    const max = tier === "free" ? FREE_TIER_ALIAS_MAX[type] : null;
    results.push({ type, used, max });
  }
  return results;
}
