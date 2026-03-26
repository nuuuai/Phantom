/**
 * Canonical `error.code` strings returned by the Phantom API (`ApiErrorBody.code`).
 * Use these instead of string literals in dashboard, extension, and tests to avoid drift.
 */
export const PHANTOM_API_ERROR_CODES = {
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  not_found: "not_found",
  validation_error: "validation_error",
  tier_limit: "tier_limit",
  upgrade_required: "upgrade_required",
  rate_limited: "rate_limited",
  scan_rate_limited: "scan_rate_limited",
  service_unavailable: "service_unavailable",
  phone_provider_unavailable: "phone_provider_unavailable",
  overloaded: "overloaded",
  sync_conflict: "sync_conflict",
  network_error: "network_error",
  invalid_response: "invalid_response",
} as const;

export type PhantomApiErrorCode =
  (typeof PHANTOM_API_ERROR_CODES)[keyof typeof PHANTOM_API_ERROR_CODES];
