import { describe, expect, it } from "vitest";
import {
  formatRotationCandidatesReply,
  rankAliasesForRotation,
} from "./rankAliasesForRotation.js";

describe("rankAliasesForRotation", () => {
  it("ranks compromised before warning by health score", () => {
    const ranked = rankAliasesForRotation([
      {
        aliasId: "a1",
        label: "Shopping",
        type: "email",
        healthStatus: "warning",
        healthScore: 40,
        spamCount: 2,
      },
      {
        aliasId: "a2",
        label: "Bank",
        type: "email",
        healthStatus: "compromised",
        healthScore: 20,
        spamCount: 0,
      },
    ]);

    expect(ranked[0]?.aliasId).toBe("a2");
    expect(ranked[0]?.priorityRank).toBe(1);
  });

  it("formats empty reply when no candidates", () => {
    expect(formatRotationCandidatesReply([])).toContain("healthy");
  });
});
