import { describe, expect, it } from "vitest";
import {
  adjustPhishingScoreForSensitivity,
  resolvePhishingQuarantineThreshold,
} from "./aiSensitivityPhishing.js";

describe("aiSensitivityPhishing", () => {
  it("lowers quarantine threshold when sensitivity is aggressive", () => {
    expect(resolvePhishingQuarantineThreshold(0)).toBeGreaterThan(
      resolvePhishingQuarantineThreshold(100)
    );
  });

  it("boosts phishing score when sensitivity is aggressive", () => {
    expect(adjustPhishingScoreForSensitivity(40, 100)).toBeGreaterThan(
      adjustPhishingScoreForSensitivity(40, 0)
    );
  });
});
