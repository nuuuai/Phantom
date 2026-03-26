import type { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

export interface AuthedUser {
  id: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthedUser;
  }
}

export const authenticateJwt: RequestHandler = (req, res, next) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token || token.length === 0) {
    res.status(401).json({
      ok: false,
      error: {
        code: "unauthorized",
        message: "Authentication required",
      },
    });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({
      ok: false,
      error: {
        code: "invalid_token",
        message: "Invalid or expired session",
      },
    });
  }
};
