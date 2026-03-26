import bcrypt from "bcrypt";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { ApiResponse, User } from "@phantom/shared";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";
import { getRedis } from "../lib/redis.js";
import {
  deleteRefreshToken,
  getRefreshTokenUserId,
  revokeRefreshToken,
  storeRefreshToken,
} from "../lib/refreshTokens.js";
import { toPublicUser } from "../lib/userPublic.js";

export const authRouter = Router();

const authRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.use(authRateLimiter);

type AuthSuccessData = {
  user: User;
  accessToken: string;
  refreshToken?: string;
};

function authSuccessResponse(
  publicUser: User,
  accessToken: string,
  refreshToken: string | null
): ApiResponse<AuthSuccessData> {
  return {
    ok: true,
    data: {
      user: publicUser,
      accessToken,
      ...(refreshToken ? { refreshToken } : {}),
    },
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
  const refreshToken = await storeRefreshToken(user.id);

  const response = authSuccessResponse(publicUser, accessToken, refreshToken);
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
  const refreshToken = await storeRefreshToken(user.id);

  const response = authSuccessResponse(publicUser, accessToken, refreshToken);
  res.json(response);
});

authRouter.post("/refresh", async (req, res) => {
  const body = req.body as { refreshToken?: string };
  const rt =
    typeof body.refreshToken === "string" && body.refreshToken.length > 0
      ? body.refreshToken
      : "";
  if (!rt) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: "refreshToken required",
      },
    });
    return;
  }

  if (!getRedis()) {
    res.status(503).json({
      ok: false,
      error: {
        code: "service_unavailable",
        message: "Refresh tokens require REDIS_URL",
      },
    });
    return;
  }

  const userId = await getRefreshTokenUserId(rt);
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: {
        code: "invalid_refresh_token",
        message: "Invalid or expired refresh token",
      },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(401).json({
      ok: false,
      error: {
        code: "invalid_refresh_token",
        message: "User not found",
      },
    });
    return;
  }

  const publicUser = toPublicUser(user);
  const accessToken = signAccessToken(user.id, user.email);
  const newRefresh = await storeRefreshToken(user.id);
  if (!newRefresh) {
    res.status(503).json({
      ok: false,
      error: {
        code: "service_unavailable",
        message: "Could not issue new refresh token",
      },
    });
    return;
  }
  await deleteRefreshToken(rt);

  const response: ApiResponse<AuthSuccessData> = {
    ok: true,
    data: {
      user: publicUser,
      accessToken,
      refreshToken: newRefresh,
    },
  };
  res.json(response);
});

authRouter.post("/logout", async (req, res) => {
  const body = req.body as { refreshToken?: string };
  const rt =
    typeof body.refreshToken === "string" && body.refreshToken.length > 0
      ? body.refreshToken
      : "";
  if (rt) {
    await revokeRefreshToken(rt);
  }
  const response: ApiResponse<Record<string, never>> = {
    ok: true,
    data: {},
  };
  res.json(response);
});
