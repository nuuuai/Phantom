import type {
  AliasHealthIntel,
  ApiResponse,
  InboxMessageCategory,
  InboxSummary,
} from "@phantom/shared";
import {
  classifyInboxMessage,
  computeAliasHealthScore,
  explainAliasHealth,
  inferAliasCategory,
} from "@phantom/shared";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const intelligenceRouter = Router();

const EMPTY_CATEGORIES: Record<InboxMessageCategory, number> = {
  spam: 0,
  marketing: 0,
  transactional: 0,
  phishing: 0,
  personal: 0,
  unknown: 0,
};

intelligenceRouter.get("/aliases/:id/intel", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const aliasId = typeof req.params.id === "string" ? req.params.id : "";
  if (!aliasId) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: "Alias id required" },
    });
    return;
  }

  const alias = await prisma.alias.findFirst({
    where: { id: aliasId, userId },
  });
  if (!alias) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Alias not found" },
    });
    return;
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const messages = await prisma.aliasInboxMessage.findMany({
    where: { aliasId, userId, receivedAt: { gte: since } },
    select: { receivedAt: true },
  });

  const byDay = new Map<string, number>();
  for (const msg of messages) {
    const day = msg.receivedAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const usageSeries = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, inboundCount]) => ({ date, inboundCount }));

  const explanation = explainAliasHealth(alias.healthStatus);
  const healthScore = computeAliasHealthScore({
    healthStatus: alias.healthStatus,
    spamCount: alias.spamCount,
    lastActivityAt: alias.lastActivityAt?.toISOString() ?? null,
  });

  const data: AliasHealthIntel = {
    aliasId: alias.id,
    healthScore,
    suggestedCategory: inferAliasCategory(alias.serviceUrl),
    explanationHeadline: explanation.headline,
    usageSeries,
    recommendations: explanation.recommendations,
  };

  const response: ApiResponse<AliasHealthIntel> = { ok: true, data };
  res.json(response);
});

intelligenceRouter.get("/inbox/summary", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const limit = 200;
  const rows = await prisma.aliasInboxMessage.findMany({
    where: { userId },
    orderBy: { receivedAt: "desc" },
    take: limit,
    select: {
      id: true,
      subject: true,
      fromAddress: true,
      snippet: true,
      isRead: true,
    },
  });

  const byCategory = { ...EMPTY_CATEGORIES };
  const classified = rows.map((r) =>
    classifyInboxMessage({
      messageId: r.id,
      subject: r.subject,
      fromAddress: r.fromAddress,
      snippet: r.snippet,
    })
  );

  for (const c of classified) {
    byCategory[c.category] += 1;
  }

  const topThreats = classified
    .filter((c) => c.category === "phishing" || c.category === "spam")
    .sort((a, b) => b.phishingScore - a.phishingScore)
    .slice(0, 5);

  const unreadCount = rows.filter((r) => !r.isRead).length;

  const data: InboxSummary = {
    totalMessages: rows.length,
    unreadCount,
    byCategory,
    topThreats,
  };

  const response: ApiResponse<InboxSummary> = { ok: true, data };
  res.json(response);
});
