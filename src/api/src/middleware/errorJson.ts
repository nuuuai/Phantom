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

function logStructuredError(
  method: string,
  path: string,
  requestId: string | undefined,
  err: unknown
) {
  const message = err instanceof Error ? err.message : String(err);
  const { status, code } = statusAndCode(err);
  const line = JSON.stringify({
    level: "error",
    service: "phantom-api",
    ts: new Date().toISOString(),
    method,
    path,
    requestId: requestId ?? null,
    httpStatus: status,
    errorCode: code,
    message: message.slice(0, 2000),
  });
  console.error(line);
}

/** Last middleware: always respond with JSON for failed requests (never empty body). */
export const errorJsonHandler: ErrorRequestHandler = (err, req, res, next) => {
  const method = req.method ?? "?";
  const path = req.originalUrl ?? req.url ?? "?";
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  logStructuredError(method, path, req.requestId, err);
  if (stack) {
    console.error(stack);
  }

  if (res.headersSent) {
    process.stderr.write(
      `phantom-api: error after response started ${method} ${path}: ${message}\n`
    );
    if (stack) {
      process.stderr.write(`${stack}\n`);
    }
    next(err);
    return;
  }

  const { status, code } = statusAndCode(err);
  const clientMessage = publicMessage(err);
  const body: ApiResponse<never> = {
    ok: false,
    error: { code, message: clientMessage },
  };
  res.status(status).type("application/json").json(body);
};
