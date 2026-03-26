import type { Notification as PrismaNotification } from "@prisma/client";
import type {
  ActivityLayerType,
  NotificationCategory,
  NotificationPriority,
  PhantomNotification,
} from "@phantom/shared";

const VALID_LAYERS = new Set<string>(["shield", "brain", "sword", "autopilot"]);

export function mapNotification(row: PrismaNotification): PhantomNotification {
  return {
    id: row.id,
    userId: row.userId,
    layer: (VALID_LAYERS.has(row.layer) ? row.layer : "shield") as ActivityLayerType,
    priority: row.priority as NotificationPriority,
    category: row.category as NotificationCategory,
    title: row.title,
    body: row.body,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
    linkTo: row.linkTo,
  };
}
