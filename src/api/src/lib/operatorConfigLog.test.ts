import { afterEach, describe, expect, it, vi } from "vitest";
import { logOperatorConfigSummary } from "./operatorConfigLog.js";

describe("logOperatorConfigSummary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("prints without throwing (smoke)", () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("JWT_SECRET", "change_me_to_a_long_random_secret_min_16_chars");
    expect(() => logOperatorConfigSummary()).not.toThrow();
  });
});
