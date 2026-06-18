import { describe, expect, it } from "vitest";
import {
  generateScamEngageDemo,
  SCAM_ENGAGE_PERSONA_IDS,
} from "./generateScamEngageDemo.js";

describe("generateScamEngageDemo", () => {
  it("returns three persona sessions in demo mode", () => {
    const result = generateScamEngageDemo("user-1", true);
    expect(result.sessions).toHaveLength(3);
    expect(result.demoMode).toBe(true);
    const ids = result.sessions.map((s) => s.personaId);
    expect(ids).toEqual(SCAM_ENGAGE_PERSONA_IDS);
  });

  it("returns empty when demo disabled", () => {
    const result = generateScamEngageDemo("user-1", false);
    expect(result.sessions).toHaveLength(0);
  });
});
