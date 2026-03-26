import type { ApiResponse, UserAccountSnapshot } from "@phantom/shared";
import { Router } from "express";
import { buildAliasUsage } from "../lib/buildAliasUsage.js";
import { prisma } from "../lib/prisma.js";
import { toPublicUser } from "../lib/userPublic.js";

export const userRouter = Router();

userRouter.get("/me", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const row = await prisma.user.findUnique({ where: { id: userId } });
  if (!row) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const aliasUsage = await buildAliasUsage(userId, row.tier);
  const data: UserAccountSnapshot = {
    user: toPublicUser(row),
    aliasUsage,
  };
  const response: ApiResponse<UserAccountSnapshot> = { ok: true, data };
  res.json(response);
});

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

userRouter.patch("/me", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const body = req.body as { forwardToEmail?: unknown };
  if (!("forwardToEmail" in body)) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: "forwardToEmail required (use null to clear)",
      },
    });
    return;
  }

  let forwardToEmail: string | null = null;
  if (body.forwardToEmail === null) {
    forwardToEmail = null;
  } else if (typeof body.forwardToEmail === "string") {
    const t = body.forwardToEmail.trim();
    if (t.length === 0) {
      forwardToEmail = null;
    } else if (!EMAIL_RE.test(t)) {
      res.status(400).json({
        ok: false,
        error: {
          code: "validation_error",
          message: "forwardToEmail must be a valid email or empty",
        },
      });
      return;
    } else {
      forwardToEmail = t.toLowerCase();
    }
  } else {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: "forwardToEmail must be string or null",
      },
    });
    return;
  }

  const row = await prisma.user.update({
    where: { id: userId },
    data: { forwardToEmail },
  });

  const aliasUsage = await buildAliasUsage(userId, row.tier);
  const data: UserAccountSnapshot = {
    user: toPublicUser(row),
    aliasUsage,
  };
  const response: ApiResponse<UserAccountSnapshot> = { ok: true, data };
  res.json(response);
});
