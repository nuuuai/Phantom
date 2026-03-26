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
