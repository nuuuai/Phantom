import type {
  ApiResponse,
  NotificationPrefItem,
  PhantomNotification,
} from "@phantom/shared";
import type { NotificationCategory as PrismaNotifCategory } from "@prisma/client";
import { Router } from "express";
import {
  categoryWhereForDisabled,
  NOTIFICATION_CATEGORIES,
} from "../lib/notificationCategoryFilter.js";
import { prisma } from "../lib/prisma.js";
import { mapNotification } from "../lib/mapNotification.js";

/**
 * Notification preferences: **read-path filter**.
 * Rows for disabled categories remain in `Notification` (writers do not check prefs);
 * `GET /api/notifications`, `/count`, and `read-all` exclude disabled categories via
 * `categoryWhereForDisabled`. Subsystems that insert notifications (e.g. email
 * webhook) always persist the row; users who disable that category no longer see it.
 */
async function getDisabledNotificationCategories(
  userId: string
): Promise<PrismaNotifCategory[]> {
  const rows = await prisma.notificationPref.findMany({
    where: { userId, enabled: false },
    select: { category: true },
  });
  return rows.map((r) => r.category);
}

export const notificationsRouter = Router();

notificationsRouter.get("/", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const unreadOnly = req.query.unread === "true";
  const limit = Math.min(
    Number(req.query.limit) || 50,
    200
  );

  const disabled = await getDisabledNotificationCategories(userId);
  const catFilter = categoryWhereForDisabled(disabled);

  const rows = await prisma.notification.findMany({
    where: {
      userId,
      ...catFilter,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      ...catFilter,
      isRead: false,
    },
  });

  const response: ApiResponse<{
    items: PhantomNotification[];
    unreadCount: number;
  }> = {
    ok: true,
    data: {
      items: rows.map(mapNotification),
      unreadCount,
    },
  };
  res.json(response);
});

notificationsRouter.get("/count", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const disabled = await getDisabledNotificationCategories(userId);
  const catFilter = categoryWhereForDisabled(disabled);

  const count = await prisma.notification.count({
    where: { userId, isRead: false, ...catFilter },
  });
  const response: ApiResponse<{ unreadCount: number }> = {
    ok: true,
    data: { unreadCount: count },
  };
  res.json(response);
});

notificationsRouter.post("/:id/read", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const notifId = req.params.id;
  const row = await prisma.notification.findFirst({
    where: { id: notifId, userId },
  });
  if (!row) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Notification not found" },
    });
    return;
  }

  const updated = await prisma.notification.update({
    where: { id: notifId },
    data: { isRead: true },
  });
  const response: ApiResponse<{ notification: PhantomNotification }> = {
    ok: true,
    data: { notification: mapNotification(updated) },
  };
  res.json(response);
});

notificationsRouter.post("/read-all", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const disabled = await getDisabledNotificationCategories(userId);
  const catFilter = categoryWhereForDisabled(disabled);

  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false, ...catFilter },
    data: { isRead: true },
  });
  const response: ApiResponse<{ updated: number }> = {
    ok: true,
    data: { updated: result.count },
  };
  res.json(response);
});

/** Seed demo notifications if user has none (disabled in **production**). */
notificationsRouter.post("/seed-demo", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  if (process.env.NODE_ENV === "production") {
    res.status(403).json({
      ok: false,
      error: {
        code: "forbidden",
        message: "Demo notification seed is disabled in production",
      },
    });
    return;
  }

  const existing = await prisma.notification.count({ where: { userId } });
  if (existing > 0) {
    const response: ApiResponse<{ seeded: number }> = {
      ok: true,
      data: { seeded: 0 },
    };
    res.json(response);
    return;
  }

  const now = Date.now();
  const demo = [
    {
      userId,
      layer: "shield",
      priority: "high" as const,
      category: "broker_removal" as const,
      title: "Spokeo confirmed removal",
      body: "Your profile was successfully removed from Spokeo. Next re-scan in 14 days.",
      createdAt: new Date(now - 3_600_000),
      linkTo: "/brokers",
    },
    {
      userId,
      layer: "shield",
      priority: "medium" as const,
      category: "alias_health" as const,
      title: "Alias health warning",
      body: "shopping_shade@phantom.id received 12 spam messages this week.",
      createdAt: new Date(now - 7_200_000),
      linkTo: "/aliases",
    },
    {
      userId,
      layer: "brain",
      priority: "critical" as const,
      category: "security_alert" as const,
      title: "Breach detected",
      body: "Email alias found in LinkedIn data breach (2024-Q4). Recommend rotating.",
      createdAt: new Date(now - 14_400_000),
      linkTo: "/dark-web",
    },
    {
      userId,
      layer: "autopilot",
      priority: "medium" as const,
      category: "broker_removal" as const,
      title: "WhitePages re-listed your data",
      body: "Automatic re-removal request submitted. Monitor in the Brokers page.",
      createdAt: new Date(now - 28_800_000),
      linkTo: "/brokers",
    },
    {
      userId,
      layer: "shield",
      priority: "low" as const,
      category: "system" as const,
      title: "Welcome to Phantom",
      body: "Your privacy command center is ready. Generate your first alias to get started.",
      createdAt: new Date(now - 86_400_000),
      linkTo: "/aliases",
    },
  ];

  await prisma.notification.createMany({ data: demo });

  const response: ApiResponse<{ seeded: number }> = {
    ok: true,
    data: { seeded: demo.length },
  };
  res.status(201).json(response);
});

notificationsRouter.get("/preferences", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const rows = await prisma.notificationPref.findMany({
    where: { userId },
  });

  const prefMap = new Map(rows.map((r) => [r.category, r.enabled]));
  const items: NotificationPrefItem[] = NOTIFICATION_CATEGORIES.map((cat) => ({
    category: cat,
    enabled: prefMap.get(cat) ?? true,
  }));

  const response: ApiResponse<{ items: NotificationPrefItem[] }> = {
    ok: true,
    data: { items },
  };
  res.json(response);
});

notificationsRouter.put("/preferences", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const body = req.body as { items?: NotificationPrefItem[] } | undefined;
  if (!body?.items || !Array.isArray(body.items)) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: "items array required" },
    });
    return;
  }

  const catSet = new Set<string>(NOTIFICATION_CATEGORIES);
  for (const item of body.items) {
    if (!catSet.has(item.category)) continue;
    if (typeof item.enabled !== "boolean") {
      res.status(400).json({
        ok: false,
        error: {
          code: "validation_error",
          message: `Each item must include boolean enabled for known category (got ${String(item.category)})`,
        },
      });
      return;
    }
    await prisma.notificationPref.upsert({
      where: {
        userId_category: { userId, category: item.category as PrismaNotifCategory },
      },
      update: { enabled: item.enabled },
      create: {
        userId,
        category: item.category as PrismaNotifCategory,
        enabled: item.enabled,
      },
    });
  }

  const rows = await prisma.notificationPref.findMany({ where: { userId } });
  const prefMap = new Map(rows.map((r) => [r.category, r.enabled]));
  const items: NotificationPrefItem[] = NOTIFICATION_CATEGORIES.map((cat) => ({
    category: cat,
    enabled: prefMap.get(cat) ?? true,
  }));

  const response: ApiResponse<{ items: NotificationPrefItem[] }> = {
    ok: true,
    data: { items },
  };
  res.json(response);
});
