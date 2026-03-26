import type { ErrorRequestHandler } from "express";
import type { ApiResponse } from "@phantom/shared";

function publicMessage(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Internal server error";
  }
  const msg = err.message;
  if (msg.includes("JWT_SECRET")) {
    return "Server configuration error (JWT secret)";
  }
  if (process.env.NODE_ENV !== "production") {
    return msg;
  }
  return "Internal server error";
}

function statusAndCode(err: unknown): { status: number; code: string } {
  if (err instanceof Error && err.message.includes("JWT_SECRET")) {
    return { status: 503, code: "service_unavailable" };
  }
  return { status: 500, code: "server_error" };
}

/** Last middleware: always respond with JSON for failed requests. */
export const errorJsonHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const { status, code } = statusAndCode(err);
  const message = publicMessage(err);
  const body: ApiResponse<never> = {
    ok: false,
    error: { code, message },
  };
  res.status(status).type("application/json").json(body);
};
