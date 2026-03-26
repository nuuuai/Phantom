import type { ApiErrorBody, ApiFailure } from "../types/apiResponse.js";

/** Canonical client-side error bucket (dashboard + extension). */
export type ClientErrorCode =
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "service_unavailable"
  | "network_error"
  | "unknown";

export type ClientErrorMeta = Error & {
  clientCode: ClientErrorCode;
  /** Original API `error.code` when available. */
  apiErrorCode: string;
  retryAfterSeconds?: number;
  /** Present when API includes `error.lastError` (e.g. phone provider misconfiguration). */
  lastError?: string | null;
};

/**
 * Maps API error payload (+ optional HTTP status from parsers) to a stable
 * bucket and user-facing copy. Prefer server `message` when present.
 */
export function normalizeClientError(err: ApiErrorBody): {
  code: ClientErrorCode;
  userMessage: string;
} {
  const http = err.httpStatus ?? 0;
  const serverMsg = err.message?.trim() ?? "";
  const code = err.code;

  if (code === "network_error") {
    return {
      code: "network_error",
      userMessage:
        serverMsg ||
        "Could not reach Phantom. Check your connection and try again.",
    };
  }

  if (code === "invalid_response" && http >= 500) {
    return {
      code: "service_unavailable",
      userMessage:
        "Phantom is temporarily unavailable. Try again in a moment.",
    };
  }

  if (http === 401 || code === "unauthorized") {
    return {
      code: "unauthorized",
      userMessage:
        serverMsg || "Session expired. Sign in again.",
    };
  }

  if (
    http === 403 ||
    code === "forbidden" ||
    code === "tier_limit" ||
    code === "upgrade_required"
  ) {
    return {
      code: "forbidden",
      userMessage:
        serverMsg || "You don't have permission for this action.",
    };
  }

  if (
    http === 429 ||
    code === "rate_limited" ||
    code === "scan_rate_limited"
  ) {
    return {
      code: "rate_limited",
      userMessage:
        serverMsg || "Too many requests. Try again shortly.",
    };
  }

  if (
    http === 503 ||
    code === "service_unavailable" ||
    code === "overloaded" ||
    code === "phone_provider_unavailable"
  ) {
    return {
      code: "service_unavailable",
      userMessage:
        serverMsg || "Phantom is temporarily unavailable. Try again in a moment.",
    };
  }

  return {
    code: "unknown",
    userMessage: serverMsg || "Something went wrong.",
  };
}

export function clientErrorFromApiFailure(failure: ApiFailure): ClientErrorMeta {
  const n = normalizeClientError(failure.error);
  const e = new Error(n.userMessage) as ClientErrorMeta;
  e.clientCode = n.code;
  e.apiErrorCode = failure.error.code;
  if (typeof failure.error.retryAfterSeconds === "number") {
    e.retryAfterSeconds = failure.error.retryAfterSeconds;
  }
  if (failure.error.lastError != null && failure.error.lastError !== "") {
    e.lastError = failure.error.lastError;
  }
  return e;
}

/** Free-tier broker scan cap: append rolling-window hint when `retryAfterSeconds` is set. */
export function formatBrokerScanRateLimit(
  baseMessage: string,
  retryAfterSeconds?: number
): string {
  if (typeof retryAfterSeconds === "number" && retryAfterSeconds > 0) {
    return `${baseMessage} Retry in ~${String(Math.max(1, Math.ceil(retryAfterSeconds / 60)))} min (rolling 24h window).`;
  }
  return baseMessage;
}

export function getQueryErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong.";
}
