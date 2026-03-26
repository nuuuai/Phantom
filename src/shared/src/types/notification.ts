import type { ActivityLayerType } from "./activityLayer.js";

export type NotificationPriority = "critical" | "high" | "medium" | "low";

export type NotificationCategory =
  | "alias_health"
  | "broker_removal"
  | "security_alert"
  | "system";

export interface PhantomNotification {
  id: string;
  userId: string;
  layer: ActivityLayerType;
  priority: NotificationPriority;
  category: NotificationCategory;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  /** Optional link target within the dashboard */
  linkTo: string | null;
}
