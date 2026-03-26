import type { User } from "@phantom/shared";
import type { UserTier as PrismaUserTier } from "@prisma/client";

export function mapTier(tier: PrismaUserTier): User["tier"] {
  if (tier === "enterprise") return "enterprise";
  if (tier === "paid") return "paid";
  return "free";
}

export function toPublicUser(row: {
  id: string;
  email: string;
  createdAt: Date;
  tier: PrismaUserTier;
  forwardToEmail?: string | null;
  subscriptionStatus?: string | null;
}): User {
  const local = row.email.split("@")[0] ?? "user";
  return {
    id: row.id,
    email: row.email,
    displayName: local.length > 0 ? local : "User",
    createdAt: row.createdAt.toISOString(),
    tier: mapTier(row.tier),
    subscriptionStatus: row.subscriptionStatus ?? null,
    forwardToEmail: row.forwardToEmail ?? null,
  };
}
