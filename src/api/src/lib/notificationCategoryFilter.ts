import type { NotificationCategory as PrismaNotifCategory } from "@prisma/client";

/** Must match Prisma `NotificationCategory` and dashboard `CATEGORY_LABELS`. */
export const NOTIFICATION_CATEGORIES: PrismaNotifCategory[] = [
  "alias_health",
  "broker_removal",
  "security_alert",
  "system",
];

const CAT_SET = new Set<string>(NOTIFICATION_CATEGORIES);

export function isKnownNotificationCategory(
  c: string
): c is PrismaNotifCategory {
  return CAT_SET.has(c);
}

/**
 * Prisma `where` fragment: exclude rows whose `category` is in `disabled`.
 */
export function categoryWhereForDisabled(
  disabled: PrismaNotifCategory[]
): { category: { notIn: PrismaNotifCategory[] } } | Record<string, never> {
  if (disabled.length === 0) return {};
  return { category: { notIn: disabled } };
}
