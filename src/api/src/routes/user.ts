import type {
  ApiResponse,
  AccountDeleteResult,
  AccountExportPayload,
  UserAccountSnapshot,
  UserAiPreferences,
} from "@phantom/shared";
import {
  parseForwardToEmailPatchBody,
  parseUserAiPreferencesPatch,
} from "@phantom/shared";
import bcrypt from "bcrypt";
import { Router } from "express";
import { buildAccountExport } from "../lib/buildAccountExport.js";
import { buildAliasUsage } from "../lib/buildAliasUsage.js";
import {
  mapUserPreferences,
  USER_AI_PREFERENCES_SELECT,
} from "../lib/mapUserPreferences.js";
import { prisma } from "../lib/prisma.js";
import { toPublicUser } from "../lib/userPublic.js";

export const userRouter = Router();

async function loadAccountSnapshot(userId: string): Promise<UserAccountSnapshot | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      tier: true,
      forwardToEmail: true,
      subscriptionStatus: true,
      ...USER_AI_PREFERENCES_SELECT,
    },
  });
  if (!row) return null;

  const aliasUsage = await buildAliasUsage(userId, row.tier);
  return {
    user: toPublicUser(row),
    aliasUsage,
    preferences: mapUserPreferences(row),
  };
}

userRouter.get("/me", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const data = await loadAccountSnapshot(userId);
  if (!data) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const response: ApiResponse<UserAccountSnapshot> = { ok: true, data };
  res.json(response);
});

userRouter.patch("/me", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const parsed = parseForwardToEmailPatchBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: parsed.message,
      },
    });
    return;
  }

  const forwardToEmail = parsed.value;

  const row = await prisma.user.update({
    where: { id: userId },
    data: { forwardToEmail },
    select: {
      id: true,
      email: true,
      createdAt: true,
      tier: true,
      forwardToEmail: true,
      subscriptionStatus: true,
      ...USER_AI_PREFERENCES_SELECT,
    },
  });

  const aliasUsage = await buildAliasUsage(userId, row.tier);
  const data: UserAccountSnapshot = {
    user: toPublicUser(row),
    aliasUsage,
    preferences: mapUserPreferences(row),
  };
  const response: ApiResponse<UserAccountSnapshot> = { ok: true, data };
  res.json(response);
});

userRouter.get("/preferences", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_AI_PREFERENCES_SELECT,
  });
  if (!row) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const data = mapUserPreferences(row);
  const response: ApiResponse<UserAiPreferences> = { ok: true, data };
  res.json(response);
});

userRouter.patch("/preferences", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const parsed = parseUserAiPreferencesPatch(req.body);
  if (!parsed.ok) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: parsed.message },
    });
    return;
  }

  const row = await prisma.user.update({
    where: { id: userId },
    data: parsed.patch,
    select: USER_AI_PREFERENCES_SELECT,
  });

  const data = mapUserPreferences(row);
  const response: ApiResponse<UserAiPreferences> = { ok: true, data };
  res.json(response);
});

userRouter.get("/export", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const data = await buildAccountExport(userId);
  if (!data) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const response: ApiResponse<AccountExportPayload> = { ok: true, data };
  res.json(response);
});

userRouter.delete("/me", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const body = req.body as { password?: unknown; confirmPhrase?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPhrase = body.confirmPhrase;

  if (confirmPhrase !== "DELETE") {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: 'Body must include { "password": "...", "confirmPhrase": "DELETE" }',
      },
    });
    return;
  }

  if (password.length < 1) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: "Password is required" },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const match = await bcrypt.compare(password, user.hashedPassword);
  if (!match) {
    res.status(403).json({
      ok: false,
      error: { code: "forbidden", message: "Incorrect password" },
    });
    return;
  }

  await prisma.user.delete({ where: { id: userId } });

  const response: ApiResponse<AccountDeleteResult> = {
    ok: true,
    data: { deleted: true },
  };
  res.json(response);
});
