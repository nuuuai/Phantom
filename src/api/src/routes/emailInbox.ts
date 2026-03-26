import type {
  AliasInboxItem,
  AliasInboxListMeta,
  ApiResponse,
} from "@phantom/shared";
import { Router } from "express";
import { buildAliasInboxWhere } from "../lib/emailInboxWhere.js";
import { prisma } from "../lib/prisma.js";

export const emailInboxRouter = Router();

emailInboxRouter.get("/", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const limitRaw = typeof req.query.limit === "string" ? req.query.limit : "40";
  const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 40));
  const offsetRaw =
    typeof req.query.offset === "string" ? req.query.offset : "0";
  const offset = Math.min(50_000, Math.max(0, parseInt(offsetRaw, 10) || 0));
  const qRaw = typeof req.query.q === "string" ? req.query.q : "";
  const unreadOnly =
    req.query.unread === "1" || req.query.unread === "true";

  const rows = await prisma.aliasInboxMessage.findMany({
    where: buildAliasInboxWhere(userId, qRaw, unreadOnly),
    orderBy: { receivedAt: "desc" },
    skip: offset,
    take: limit,
    include: {
      alias: { select: { value: true } },
    },
  });

  const items: AliasInboxItem[] = rows.map((r) => ({
    id: r.id,
    aliasId: r.aliasId,
    aliasAddress: r.alias.value,
    subject: r.subject,
    fromAddress: r.fromAddress,
    snippet: r.snippet,
    receivedAt: r.receivedAt.toISOString(),
    isRead: r.isRead,
  }));

  const meta: AliasInboxListMeta = { limit, offset };
  const response: ApiResponse<{
    items: AliasInboxItem[];
    meta: AliasInboxListMeta;
  }> = {
    ok: true,
    data: { items, meta },
  };
  res.json(response);
});

emailInboxRouter.patch("/:id/read", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: "Message id required" },
    });
    return;
  }

  const body = req.body as { isRead?: unknown };
  const isRead = body.isRead === false ? false : true;

  const updated = await prisma.aliasInboxMessage.updateMany({
    where: { id, userId },
    data: { isRead },
  });

  if (updated.count === 0) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Inbox message not found" },
    });
    return;
  }

  const row = await prisma.aliasInboxMessage.findFirst({
    where: { id, userId },
    include: { alias: { select: { value: true } } },
  });
  if (!row) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Inbox message not found" },
    });
    return;
  }

  const item: AliasInboxItem = {
    id: row.id,
    aliasId: row.aliasId,
    aliasAddress: row.alias.value,
    subject: row.subject,
    fromAddress: row.fromAddress,
    snippet: row.snippet,
    receivedAt: row.receivedAt.toISOString(),
    isRead: row.isRead,
  };

  const response: ApiResponse<{ item: AliasInboxItem }> = {
    ok: true,
    data: { item },
  };
  res.json(response);
});
