import { describe, expect, it } from "vitest";
import { PHANTOM_API_ERROR_CODES } from "./constants/apiErrorCodes.js";
import { parseForwardToEmailPatchBody } from "./lib/forwardEmail.js";
import { RATE_LIMIT_RETRY_MS } from "./constants/http.js";
import { RISK_THRESHOLDS } from "./constants/riskThresholds.js";

describe("shared", () => {
  it("exports risk thresholds", () => {
    expect(RISK_THRESHOLDS.LOW_MAX).toBe(24);
  });

  it("exports rate-limit retry delay", () => {
    expect(RATE_LIMIT_RETRY_MS).toBe(1500);
  });

  it("exports canonical API error codes", () => {
    expect(PHANTOM_API_ERROR_CODES.tier_limit).toBe("tier_limit");
    expect(PHANTOM_API_ERROR_CODES.scan_rate_limited).toBe(
      "scan_rate_limited"
    );
  });

  it("parses forward-to email patch bodies", () => {
    expect(parseForwardToEmailPatchBody({ forwardToEmail: null }).ok).toBe(
      true
    );
  });
});
