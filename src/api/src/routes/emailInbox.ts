import type { AliasInboxItem, ApiResponse } from "@phantom/shared";
import { Router } from "express";
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

  const rows = await prisma.aliasInboxMessage.findMany({
    where: { userId },
    orderBy: { receivedAt: "desc" },
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
  }));

  const response: ApiResponse<{ items: AliasInboxItem[] }> = {
    ok: true,
    data: { items },
  };
  res.json(response);
});
