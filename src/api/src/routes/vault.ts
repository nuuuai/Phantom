import type { ApiResponse } from "@phantom/shared";
import { generateVaultSalt } from "@phantom/shared";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const vaultRouter = Router();

vaultRouter.get("/salt", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { vaultSalt: true },
  });

  const response: ApiResponse<{ vaultSalt: string | null }> = {
    ok: true,
    data: { vaultSalt: user?.vaultSalt ?? null },
  };
  res.json(response);
});

vaultRouter.post("/init", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { vaultSalt: true },
  });
  if (!user) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  if (user.vaultSalt) {
    const response: ApiResponse<{ vaultSalt: string }> = {
      ok: true,
      data: { vaultSalt: user.vaultSalt },
    };
    res.json(response);
    return;
  }

  const salt = generateVaultSalt();
  await prisma.user.update({
    where: { id: userId },
    data: { vaultSalt: salt },
  });

  const response: ApiResponse<{ vaultSalt: string }> = {
    ok: true,
    data: { vaultSalt: salt },
  };
  res.status(201).json(response);
});

/** E2E vault blob sync (extension ↔ dashboard); ciphertext is opaque to the API. */
vaultRouter.get("/sync", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { vaultSyncCiphertext: true, vaultSyncVersion: true },
  });

  const response: ApiResponse<{
    ciphertext: string | null;
    version: number;
  }> = {
    ok: true,
    data: {
      ciphertext: user?.vaultSyncCiphertext ?? null,
      version: user?.vaultSyncVersion ?? 0,
    },
  };
  res.json(response);
});

vaultRouter.put("/sync", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const body = req.body as {
    ciphertext?: string;
    clientVersion?: unknown;
  };
  const ciphertext =
    typeof body.ciphertext === "string" ? body.ciphertext : "";
  const clientVersion =
    typeof body.clientVersion === "number" && Number.isFinite(body.clientVersion)
      ? body.clientVersion
      : 0;

  if (ciphertext.length === 0) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: "ciphertext string required",
      },
    });
    return;
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { vaultSyncVersion: true },
  });
  const serverVersion = current?.vaultSyncVersion ?? 0;
  if (serverVersion > clientVersion) {
    res.status(409).json({
      ok: false,
      error: {
        code: "sync_conflict",
        message: `Server vault sync is newer (v${String(serverVersion)} > v${String(clientVersion)}); GET /api/vault/sync then merge`,
      },
    });
    return;
  }

  const nextVersion = serverVersion + 1;
  await prisma.user.update({
    where: { id: userId },
    data: {
      vaultSyncCiphertext: ciphertext,
      vaultSyncVersion: nextVersion,
    },
  });

  const response: ApiResponse<{ version: number }> = {
    ok: true,
    data: { version: nextVersion },
  };
  res.json(response);
});
