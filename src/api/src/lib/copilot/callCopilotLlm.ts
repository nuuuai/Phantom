import type { CopilotLlmConfig } from "./envCopilot.js";
import {
  COPILOT_ANTHROPIC_TOOLS,
  COPILOT_OPENAI_TOOLS,
  type CopilotLlmResult,
  parseAnthropicToolCalls,
  parseOpenAiToolCalls,
} from "./copilotToolSchemas.js";
import {
  buildCopilotSystemPrompt,
  buildCopilotUserMessage,
  type CopilotAccountSnapshot,
} from "./copilotPrompt.js";

export async function callCopilotLlm(
  config: CopilotLlmConfig,
  snapshot: CopilotAccountSnapshot,
  userMessage: string
): Promise<CopilotLlmResult> {
  const system = buildCopilotSystemPrompt(snapshot);
  const user = buildCopilotUserMessage(userMessage);

  if (config.provider === "openai") {
    return callOpenAi(config, system, user);
  }
  return callAnthropic(config, system, user);
}

async function callOpenAi(
  config: CopilotLlmConfig,
  system: string,
  user: string
): Promise<CopilotLlmResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.3,
      max_tokens: 800,
      tools: COPILOT_OPENAI_TOOLS,
      tool_choice: "auto",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error("copilot_llm_error");
  }

  const json = (await res.json()) as {
    choices?: {
      message?: {
        content?: string | null;
        tool_calls?: {
          function?: { name?: string; arguments?: string };
        }[];
      };
    }[];
  };
  const parsed = parseOpenAiToolCalls(json.choices?.[0]?.message);
  if (!parsed.reply && parsed.toolCalls.length === 0) {
    throw new Error("copilot_llm_empty");
  }
  return parsed;
}

async function callAnthropic(
  config: CopilotLlmConfig,
  system: string,
  user: string
): Promise<CopilotLlmResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 800,
      system,
      tools: COPILOT_ANTHROPIC_TOOLS,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    throw new Error("copilot_llm_error");
  }

  const json = (await res.json()) as {
    content?: { type: string; text?: string; name?: string; input?: unknown }[];
  };
  const parsed = parseAnthropicToolCalls(json.content ?? []);
  if (!parsed.reply && parsed.toolCalls.length === 0) {
    throw new Error("copilot_llm_empty");
  }
  return parsed;
}
