import type { RequestHandler } from "express";
import type { ApiErrorBody } from "@phantom/shared";

function routePath(req: Parameters<RequestHandler>[0]): string {
  const u = req.originalUrl ?? req.url ?? "";
  const q = u.indexOf("?");
  return q === -1 ? u : u.slice(0, q);
}

/** Unmatched routes → JSON 404 (never empty HTML). */
export const notFoundJson: RequestHandler = (req, res) => {
  const err: ApiErrorBody = {
    code: "not_found",
    message: `No route ${req.method} ${routePath(req)}`,
  };
  if (process.env.NODE_ENV !== "production" && req.requestId) {
    err.requestId = req.requestId;
  }
  res.status(404).type("application/json").json({
    ok: false,
    error: err,
  });
};
