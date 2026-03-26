import bcrypt from "bcrypt";
import { Router } from "express";
import type { ApiResponse, User } from "@phantom/shared";
import type { UserTier as PrismaUserTier } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";

export const authRouter = Router();

function mapTier(tier: PrismaUserTier): User["tier"] {
  if (tier === "enterprise") return "enterprise";
  if (tier === "paid") return "paid";
  return "free";
}

function toPublicUser(row: {
  id: string;
  email: string;
  createdAt: Date;
  tier: PrismaUserTier;
}): User {
  const local = row.email.split("@")[0] ?? "user";
  return {
    id: row.id,
    email: row.email,
    displayName: local.length > 0 ? local : "User",
    createdAt: row.createdAt.toISOString(),
    tier: mapTier(row.tier),
  };
}

authRouter.post("/register", async (req, res) => {
  const body = req.body as {
    email?: string;
    password?: string;
  };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email.includes("@") || password.length < 8) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: "Valid email and password (8+ chars) required",
      },
    });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({
      ok: false,
      error: {
        code: "email_taken",
        message: "An account with this email already exists",
      },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, hashedPassword },
  });

  const publicUser = toPublicUser(user);
  const accessToken = signAccessToken(user.id, user.email);

  const response: ApiResponse<{ user: User; accessToken: string }> = {
    ok: true,
    data: { user: publicUser, accessToken },
  };
  res.status(201).json(response);
});

authRouter.post("/login", async (req, res) => {
  const body = req.body as { email?: string; password?: string };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: "Email and password required",
      },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({
      ok: false,
      error: {
        code: "invalid_credentials",
        message: "Invalid email or password",
      },
    });
    return;
  }

  const match = await bcrypt.compare(password, user.hashedPassword);
  if (!match) {
    res.status(401).json({
      ok: false,
      error: {
        code: "invalid_credentials",
        message: "Invalid email or password",
      },
    });
    return;
  }

  const publicUser = toPublicUser(user);
  const accessToken = signAccessToken(user.id, user.email);

  const response: ApiResponse<{ user: User; accessToken: string }> = {
    ok: true,
    data: { user: publicUser, accessToken },
  };
  res.json(response);
});
