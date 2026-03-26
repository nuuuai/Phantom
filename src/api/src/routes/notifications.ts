import type { ApiResponse, PhantomNotification } from "@phantom/shared";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { mapNotification } from "../lib/mapNotification.js";

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

  const rows = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const response: ApiResponse<{
    items: PhantomNotification[];
    unreadCount: number;
  }> = {
    ok: true,
    data: {
      items: rows.map(mapNotification),
      unreadCount: rows.filter((r) => !r.isRead).length,
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

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
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

  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  const response: ApiResponse<{ updated: number }> = {
    ok: true,
    data: { updated: result.count },
  };
  res.json(response);
});

/** Seed demo notifications if user has none */
notificationsRouter.post("/seed-demo", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
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
