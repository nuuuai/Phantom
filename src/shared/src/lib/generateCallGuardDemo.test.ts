import { describe, expect, it } from "vitest";
import { generateCallGuardDemo } from "./generateCallGuardDemo.js";

describe("generateCallGuardDemo", () => {
  it("returns empty summary when demo disabled", () => {
    const result = generateCallGuardDemo("user-abc", false);
    expect(result.demoMode).toBe(false);
    expect(result.recentLogs).toHaveLength(0);
  });

  it("is deterministic for the same user id", () => {
    const a = generateCallGuardDemo("user-stable-1", true);
    const b = generateCallGuardDemo("user-stable-1", true);
    expect(a.recentLogs.map((l) => l.id)).toEqual(b.recentLogs.map((l) => l.id));
    expect(a.totalScreened).toBe(b.totalScreened);
  });

  it("never includes raw phone numbers in logs", () => {
    const result = generateCallGuardDemo("user-x", true);
    for (const log of result.recentLogs) {
      expect(log.callerNumberHash).toMatch(/^anon-[0-9a-f]{6}$/);
    }
  });
});
