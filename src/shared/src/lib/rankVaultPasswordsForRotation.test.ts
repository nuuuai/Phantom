import { describe, expect, it } from "vitest";
import { rankVaultPasswordsForRotation } from "./rankVaultPasswordsForRotation.js";

describe("rankVaultPasswordsForRotation", () => {
  it("ranks breached reused passwords highest", () => {
    const ranked = rankVaultPasswordsForRotation([
      {
        id: "a",
        label: "Shop",
        isBreached: false,
        breachCount: 0,
        reuseCount: 1,
      },
      {
        id: "b",
        label: "Bank",
        isBreached: true,
        breachCount: 5000,
        reuseCount: 3,
      },
    ]);

    expect(ranked[0]?.entryId).toBe("b");
    expect(ranked[0]?.priorityRank).toBe(1);
  });
});
