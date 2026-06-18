export type CopilotLlmProvider = "openai" | "anthropic";

export interface CopilotLlmConfig {
  provider: CopilotLlmProvider;
  apiKey: string;
  model: string;
}

export function getCopilotLlmConfig(): CopilotLlmConfig | null {
  const enabled = process.env.COPILOT_LLM_ENABLED === "1";
  if (!enabled) return null;

  const provider = process.env.COPILOT_LLM_PROVIDER?.trim().toLowerCase();
  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;
    return {
      provider: "openai",
      apiKey,
      model: process.env.COPILOT_OPENAI_MODEL?.trim() || "gpt-4o-mini",
    };
  }
  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) return null;
    return {
      provider: "anthropic",
      apiKey,
      model:
        process.env.COPILOT_ANTHROPIC_MODEL?.trim() ||
        "claude-3-5-haiku-20241022",
    };
  }
  return null;
}

export function getCopilotStatus(): {
  enabled: boolean;
  provider: CopilotLlmProvider | null;
  model: string | null;
} {
  const cfg = getCopilotLlmConfig();
  if (!cfg) {
    return { enabled: false, provider: null, model: null };
  }
  return { enabled: true, provider: cfg.provider, model: cfg.model };
}
