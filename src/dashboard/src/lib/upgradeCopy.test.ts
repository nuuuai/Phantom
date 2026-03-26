import { PHANTOM_API_ERROR_CODES } from "@phantom/shared";
import { describe, expect, it } from "vitest";
import {
  apiErrorCodeToUpgradeReason,
  upgradeBody,
  upgradeTitle,
} from "./upgradeCopy.js";

describe("apiErrorCodeToUpgradeReason", () => {
  it("maps API codes to upgrade reasons", () => {
    expect(
      apiErrorCodeToUpgradeReason(PHANTOM_API_ERROR_CODES.scan_rate_limited)
    ).toBe("scan_rate_limited");
    expect(
      apiErrorCodeToUpgradeReason(PHANTOM_API_ERROR_CODES.upgrade_required)
    ).toBe("removal_queue");
    expect(apiErrorCodeToUpgradeReason(PHANTOM_API_ERROR_CODES.tier_limit)).toBe(
      "alias_cap"
    );
    expect(apiErrorCodeToUpgradeReason("unknown")).toBeNull();
  });
});

describe("upgradeCopy strings", () => {
  it("includes retry hint for scan_rate_limited", () => {
    const s = upgradeBody("scan_rate_limited", { retryAfterSeconds: 120 });
    expect(s).toMatch(/2/);
    expect(s).toMatch(/unlimited/i);
  });

  it("mentions simulation for removal_queue title/body pattern", () => {
    expect(upgradeTitle("removal_queue")).toMatch(/Pro/);
    expect(upgradeBody("removal_queue")).toMatch(/simulated/i);
  });

  it("formats alias_cap with tierLimit", () => {
    const s = upgradeBody("alias_cap", {
      tierLimit: { aliasType: "email", used: 3, max: 3 },
    });
    expect(s).toMatch(/email/);
    expect(s).toMatch(/3/);
  });

  it("dark_web mentions HIBP honestly", () => {
    expect(upgradeTitle("dark_web")).toMatch(/Dark web/i);
    expect(upgradeBody("dark_web")).toMatch(/Have I Been Pwned/i);
    expect(upgradeBody("dark_web")).toMatch(/not 24\/7/i);
  });
});

