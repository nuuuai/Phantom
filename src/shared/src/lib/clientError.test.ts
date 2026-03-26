import { describe, expect, it } from "vitest";
import { PHANTOM_API_ERROR_CODES } from "../constants/apiErrorCodes.js";
import {
  clientErrorFromApiFailure,
  formatBrokerScanRateLimit,
  normalizeClientError,
} from "./clientError.js";

describe("normalizeClientError", () => {
  it("maps 401 to unauthorized", () => {
    const n = normalizeClientError({
      code: PHANTOM_API_ERROR_CODES.unauthorized,
      message: "",
      httpStatus: 401,
    });
    expect(n.code).toBe("unauthorized");
    expect(n.userMessage).toContain("Sign in");
  });

  it("preserves tier_limit message as forbidden", () => {
    const n = normalizeClientError({
      code: PHANTOM_API_ERROR_CODES.tier_limit,
      message: "Cap reached",
      httpStatus: 403,
    });
    expect(n.code).toBe("forbidden");
    expect(n.userMessage).toBe("Cap reached");
  });

  it("maps scan_rate_limited to rate_limited", () => {
    const n = normalizeClientError({
      code: PHANTOM_API_ERROR_CODES.scan_rate_limited,
      message: "Daily scan limit reached",
      httpStatus: 429,
      retryAfterSeconds: 3600,
    });
    expect(n.code).toBe("rate_limited");
    expect(n.userMessage).toBe("Daily scan limit reached");
  });

  it("maps network_error code", () => {
    const n = normalizeClientError({
      code: PHANTOM_API_ERROR_CODES.network_error,
      message: "Could not reach API",
    });
    expect(n.code).toBe("network_error");
    expect(n.userMessage).toBe("Could not reach API");
  });

  it("maps phone_provider_unavailable to service_unavailable", () => {
    const n = normalizeClientError({
      code: PHANTOM_API_ERROR_CODES.phone_provider_unavailable,
      message: "Set TWILIO_ACCOUNT_SID or use mock",
      httpStatus: 503,
    });
    expect(n.code).toBe("service_unavailable");
    expect(n.userMessage).toContain("TWILIO");
  });
});

describe("clientErrorFromApiFailure", () => {
  it("attaches apiErrorCode and retryAfterSeconds", () => {
    const err = clientErrorFromApiFailure({
      ok: false,
      error: {
        code: PHANTOM_API_ERROR_CODES.scan_rate_limited,
        message: "limit",
        httpStatus: 429,
        retryAfterSeconds: 120,
      },
    });
    expect(err.apiErrorCode).toBe("scan_rate_limited");
    expect(err.retryAfterSeconds).toBe(120);
    expect(err.clientCode).toBe("rate_limited");
  });

  it("attaches lastError from API error body", () => {
    const err = clientErrorFromApiFailure({
      ok: false,
      error: {
        code: PHANTOM_API_ERROR_CODES.phone_provider_unavailable,
        message: "Twilio not configured",
        httpStatus: 503,
        lastError: "TWILIO_ACCOUNT_SID missing",
      },
    });
    expect(err.lastError).toBe("TWILIO_ACCOUNT_SID missing");
  });
});

describe("formatBrokerScanRateLimit", () => {
  it("appends minute hint when retryAfterSeconds > 0", () => {
    expect(formatBrokerScanRateLimit("Too many scans", 3600)).toContain(
      "60 min"
    );
  });
});
