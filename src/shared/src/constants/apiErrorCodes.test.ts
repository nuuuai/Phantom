import { describe, expect, it } from "vitest";
import { PHANTOM_API_ERROR_CODES } from "./apiErrorCodes.js";

describe("PHANTOM_API_ERROR_CODES", () => {
  it("exposes stable tier and gate codes", () => {
    expect(PHANTOM_API_ERROR_CODES.tier_limit).toBe("tier_limit");
    expect(PHANTOM_API_ERROR_CODES.upgrade_required).toBe("upgrade_required");
    expect(PHANTOM_API_ERROR_CODES.scan_rate_limited).toBe("scan_rate_limited");
    expect(PHANTOM_API_ERROR_CODES.broker_scan_config_invalid).toBe(
      "broker_scan_config_invalid"
    );
  });
});
