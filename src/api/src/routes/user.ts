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
