import type { Prisma } from "@prisma/client";

/**
 * Builds Prisma where for alias inbox list: always scoped to userId;
 * optional case-insensitive substring match on subject, from, snippet (PostgreSQL).
 */
export function buildAliasInboxWhere(
  userId: string,
  q: string,
  unreadOnly: boolean,
): Prisma.AliasInboxMessageWhereInput {
  const trimmed = q.trim();
  const base: Prisma.AliasInboxMessageWhereInput = unreadOnly
    ? { userId, isRead: false }
    : { userId };

  if (trimmed.length === 0) {
    return base;
  }
  return {
    AND: [
      base,
      {
        OR: [
          { subject: { contains: trimmed, mode: "insensitive" } },
          { fromAddress: { contains: trimmed, mode: "insensitive" } },
          { snippet: { contains: trimmed, mode: "insensitive" } },
        ],
      },
    ],
  };
}
