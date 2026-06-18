import { describe, expect, it } from "vitest";
import { listThreatIntelPatterns } from "./threatIntelCatalog.js";

describe("threatIntelCatalog", () => {
  it("lists at least eight active patterns", () => {
    const patterns = listThreatIntelPatterns();
    expect(patterns.length).toBeGreaterThanOrEqual(8);
  });
});
