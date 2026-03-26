import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

/** Propagate or generate `X-Request-Id` for logs and error responses. */
export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const fromHeader = req.headers["x-request-id"];
  const id =
    typeof fromHeader === "string" && fromHeader.trim().length > 0
      ? fromHeader.trim().slice(0, 128)
      : randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
};
