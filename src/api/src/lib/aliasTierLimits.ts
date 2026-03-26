import type { AliasType, UserTier } from "@prisma/client";
import { FREE_TIER_ALIAS_MAX } from "@phantom/shared";
import { prisma } from "./prisma.js";

export async function assertCanCreateAlias(
  userId: string,
  tier: UserTier,
  type: AliasType
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (tier !== "free") {
    return { ok: true };
  }
  const max = FREE_TIER_ALIAS_MAX[type];
  const used = await prisma.alias.count({
    where: { userId, type, isActive: true },
  });
  if (used >= max) {
    const label = max === 1 ? "alias" : "aliases";
    return {
      ok: false,
      message: `Free tier allows ${String(max)} ${type} ${label}. Upgrade to Phantom Pro for unlimited.`,
    };
  }
  return { ok: true };
}
