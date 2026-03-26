import { describe, expect, it } from "vitest";
import {
  clientErrorFromApiFailure,
  formatBrokerScanRateLimit,
  normalizeClientError,
} from "./clientError.js";

describe("normalizeClientError", () => {
  it("maps 401 to unauthorized", () => {
    const n = normalizeClientError({
      code: "unauthorized",
      message: "",
      httpStatus: 401,
    });
    expect(n.code).toBe("unauthorized");
    expect(n.userMessage).toContain("Sign in");
  });

  it("preserves tier_limit message as forbidden", () => {
    const n = normalizeClientError({
      code: "tier_limit",
      message: "Cap reached",
      httpStatus: 403,
    });
    expect(n.code).toBe("forbidden");
    expect(n.userMessage).toBe("Cap reached");
  });

  it("maps scan_rate_limited to rate_limited", () => {
    const n = normalizeClientError({
      code: "scan_rate_limited",
      message: "Daily scan limit reached",
      httpStatus: 429,
      retryAfterSeconds: 3600,
    });
    expect(n.code).toBe("rate_limited");
    expect(n.userMessage).toBe("Daily scan limit reached");
  });

  it("maps network_error code", () => {
    const n = normalizeClientError({
      code: "network_error",
      message: "Could not reach API",
    });
    expect(n.code).toBe("network_error");
    expect(n.userMessage).toBe("Could not reach API");
  });
});

describe("clientErrorFromApiFailure", () => {
  it("attaches apiErrorCode and retryAfterSeconds", () => {
    const err = clientErrorFromApiFailure({
      ok: false,
      error: {
        code: "scan_rate_limited",
        message: "limit",
        httpStatus: 429,
        retryAfterSeconds: 120,
      },
    });
    expect(err.apiErrorCode).toBe("scan_rate_limited");
    expect(err.retryAfterSeconds).toBe(120);
    expect(err.clientCode).toBe("rate_limited");
  });
});

describe("formatBrokerScanRateLimit", () => {
  it("appends minute hint when retryAfterSeconds > 0", () => {
    expect(formatBrokerScanRateLimit("Too many scans", 3600)).toContain(
      "60 min"
    );
  });
});
