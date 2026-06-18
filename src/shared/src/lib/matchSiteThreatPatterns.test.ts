import { describe, expect, it } from "vitest";
import { matchSiteThreatPatterns } from "./matchSiteThreatPatterns.js";
import { THREAT_INTEL_CATALOG } from "./threatIntelCatalog.js";

describe("matchSiteThreatPatterns", () => {
  it("matches amazon domain to charge scam pattern", () => {
    const hit = matchSiteThreatPatterns("shop.amazon.com", THREAT_INTEL_CATALOG);
    expect(hit?.id).toBe("tp-amazon-charge");
  });

  it("returns null for benign local host", () => {
    expect(matchSiteThreatPatterns("localhost", THREAT_INTEL_CATALOG)).toBeNull();
  });
});
