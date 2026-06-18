import { afterEach, describe, expect, it } from "vitest";
import { getCopilotLlmConfig, getCopilotStatus } from "./envCopilot.js";

describe("envCopilot", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("returns null when disabled", () => {
    process.env.COPILOT_LLM_ENABLED = "0";
    expect(getCopilotLlmConfig()).toBeNull();
    expect(getCopilotStatus().enabled).toBe(false);
  });

  it("returns openai config when enabled", () => {
    process.env.COPILOT_LLM_ENABLED = "1";
    process.env.COPILOT_LLM_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";
    const cfg = getCopilotLlmConfig();
    expect(cfg?.provider).toBe("openai");
    expect(cfg?.model).toBeTruthy();
  });
});
