import { randomUUID } from "node:crypto";
import type { ApiResponse } from "@phantom/shared";
import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { computePhantomInboundDedupeKey } from "../lib/inboundWebhookDedupe.js";
import { isPrismaUniqueViolation } from "../lib/prismaUnique.js";
import { verifyInboundSignature } from "../lib/inboundWebhookSignature.js";

export const webhookEmailInboundRouter = Router();

const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

webhookEmailInboundRouter.post(
  "/email-inbound",
  webhookLimiter,
  express.raw({ type: "application/json", limit: "256kb" }),
  async (req, res) => {
    const requestId = randomUUID();
    res.setHeader("X-Phantom-Request-Id", requestId);

    const secret = process.env.INBOUND_WEBHOOK_SECRET?.trim();
    if (!secret || secret.length < 16) {
      res.status(503).json({
        ok: false,
        error: {
          code: "webhook_unconfigured",
          message:
            "INBOUND_WEBHOOK_SECRET is not set (min 16 chars). Required for inbound email ingestion.",
        },
      });
      return;
    }

    const ctRaw = req.headers["content-type"];
    const ct = Array.isArray(ctRaw) ? ctRaw[0] : ctRaw ?? "";
    if (!/application\/json/i.test(ct)) {
      res.status(415).json({
        ok: false,
        error: {
          code: "unsupported_media_type",
          message: "Content-Type must be application/json (raw body bytes for HMAC)",
        },
      });
      return;
    }

    const raw = req.body;
    if (!Buffer.isBuffer(raw)) {
      res.status(400).json({
        ok: false,
        error: { code: "invalid_body", message: "Expected raw JSON body" },
      });
      return;
    }

    const sig = req.headers["x-phantom-signature"];
    const sigStr = Array.isArray(sig) ? sig[0] : sig;
    if (!verifyInboundSignature(raw, sigStr, secret)) {
      res.status(401).json({
        ok: false,
        error: { code: "invalid_signature", message: "Bad or missing signature" },
      });
      return;
    }

    let body: {
      aliasAddress?: unknown;
      subject?: unknown;
      fromAddress?: unknown;
      snippet?: unknown;
      receivedAt?: unknown;
      providerMessageId?: unknown;
    };
    try {
      body = JSON.parse(raw.toString("utf8")) as typeof body;
    } catch {
      res.status(400).json({
        ok: false,
        error: { code: "invalid_json", message: "Body is not valid JSON" },
      });
      return;
    }

    const aliasAddress =
      typeof body.aliasAddress === "string" ? body.aliasAddress.trim() : "";
    if (!aliasAddress.includes("@") || aliasAddress.length > 254) {
      res.status(400).json({
        ok: false,
        error: {
          code: "validation_error",
          message: "aliasAddress must be a full email (max 254 chars)",
        },
      });
      return;
    }

    const subject =
      typeof body.subject === "string" && body.subject.length > 0
        ? body.subject.slice(0, 512)
        : "(no subject)";
    const fromAddress =
      typeof body.fromAddress === "string" && body.fromAddress.length > 0
        ? body.fromAddress.slice(0, 512)
        : "unknown";
    const snippet =
      typeof body.snippet === "string"
        ? body.snippet.slice(0, 8000)
        : "";
    let receivedAt = new Date();
    if (typeof body.receivedAt === "string") {
      const d = new Date(body.receivedAt);
      if (!Number.isNaN(d.getTime())) receivedAt = d;
    }

    const providerFromBody =
      typeof body.providerMessageId === "string" &&
      body.providerMessageId.trim().length > 0
        ? body.providerMessageId.trim().slice(0, 512)
        : null;

    const resolvedMessageId =
      providerFromBody ??
      computePhantomInboundDedupeKey(
        aliasAddress,
        fromAddress,
        subject,
        receivedAt,
        snippet,
      );

    const existing = await prisma.aliasInboxMessage.findUnique({
      where: { providerMessageId: resolvedMessageId },
    });
    if (existing) {
      const response: ApiResponse<{ deduped: true }> = {
        ok: true,
        data: { deduped: true },
      };
      res.json(response);
      return;
    }

    const normalizedAddr = aliasAddress.trim().toLowerCase();
    const alias = await prisma.alias.findFirst({
      where: {
        type: "email",
        isActive: true,
        value: {
          equals: normalizedAddr,
          mode: "insensitive",
        },
      },
    });

    if (!alias) {
      res.status(404).json({
        ok: false,
        error: {
          code: "alias_not_found",
          message: "No active email alias matches aliasAddress",
        },
      });
      return;
    }

    let rowId: string;
    try {
      const outcome = await prisma.$transaction(async (tx) => {
        const dup = await tx.aliasInboxMessage.findUnique({
          where: { providerMessageId: resolvedMessageId },
        });
        if (dup) {
          return { kind: "deduped" as const };
        }
        const row = await tx.aliasInboxMessage.create({
          data: {
            userId: alias.userId,
            aliasId: alias.id,
            subject,
            fromAddress,
            snippet,
            receivedAt,
            providerMessageId: resolvedMessageId,
          },
        });
        await tx.notification.create({
          data: {
            userId: alias.userId,
            layer: "shield",
            priority: "low",
            category: "system",
            title: `Mail to ${aliasAddress}`,
            body:
              snippet.length > 0
                ? snippet.slice(0, 200)
                : `From ${fromAddress}`,
            linkTo: "/inbox",
          },
        });
        await tx.alias.update({
          where: { id: alias.id },
          data: { lastActivityAt: receivedAt },
        });
        return { kind: "created" as const, id: row.id };
      });
      if (outcome.kind === "deduped") {
        const response: ApiResponse<{ deduped: true }> = {
          ok: true,
          data: { deduped: true },
        };
        res.json(response);
        return;
      }
      rowId = outcome.id;
    } catch (e) {
      if (isPrismaUniqueViolation(e)) {
        const response: ApiResponse<{ deduped: true }> = {
          ok: true,
          data: { deduped: true },
        };
        res.json(response);
        return;
      }
      throw e;
    }

    const response: ApiResponse<{ id: string }> = {
      ok: true,
      data: { id: rowId },
    };
    res.status(201).json(response);
  }
);
