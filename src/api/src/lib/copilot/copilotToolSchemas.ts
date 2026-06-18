import type { CopilotActionParams, CopilotToolId } from "@phantom/shared";

export interface CopilotLlmToolCall {
  toolId: CopilotToolId;
  params?: CopilotActionParams;
}

export interface CopilotLlmResult {
  reply: string;
  toolCalls: CopilotLlmToolCall[];
}

const TOOL_IDS: CopilotToolId[] = [
  "start_broker_scan",
  "rotate_alias",
  "request_broker_removals",
];

export function isCopilotToolId(name: string): name is CopilotToolId {
  return TOOL_IDS.includes(name as CopilotToolId);
}

export const COPILOT_OPENAI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "start_broker_scan",
      description:
        "Propose running a data-broker exposure scan for the user's account. Requires user confirmation.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "rotate_alias",
      description:
        "Propose rotating a compromised or warning alias. Requires user confirmation. Omit aliasId to rotate the highest-priority candidate.",
      parameters: {
        type: "object",
        properties: {
          aliasId: { type: "string", description: "Alias ID to rotate" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "request_broker_removals",
      description:
        "Propose submitting opt-out requests for all exposed brokers (Pro tier). Requires user confirmation.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

export const COPILOT_ANTHROPIC_TOOLS = [
  {
    name: "start_broker_scan",
    description:
      "Propose running a data-broker exposure scan. Requires user confirmation.",
    input_schema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "rotate_alias",
    description:
      "Propose rotating a warning/compromised alias. Requires confirmation.",
    input_schema: {
      type: "object",
      properties: {
        aliasId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "request_broker_removals",
    description:
      "Propose bulk broker removal requests for exposed listings. Requires confirmation.",
    input_schema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

export function parseOpenAiToolCalls(
  message: {
    content?: string | null;
    tool_calls?: {
      function?: { name?: string; arguments?: string };
    }[];
  } | undefined
): CopilotLlmResult {
  const toolCalls: CopilotLlmToolCall[] = [];
  for (const tc of message?.tool_calls ?? []) {
    const name = tc.function?.name;
    if (!name || !isCopilotToolId(name)) continue;
    let params: CopilotActionParams = {};
    try {
      const parsed = JSON.parse(tc.function?.arguments ?? "{}") as {
        aliasId?: string;
      };
      if (name === "rotate_alias" && typeof parsed.aliasId === "string") {
        params = { aliasId: parsed.aliasId };
      }
    } catch {
      params = {};
    }
    toolCalls.push({ toolId: name, params });
  }
  const reply = message?.content?.trim() ?? "";
  return { reply, toolCalls };
}

export function parseAnthropicToolCalls(
  content: { type: string; text?: string; name?: string; input?: unknown }[]
): CopilotLlmResult {
  const toolCalls: CopilotLlmToolCall[] = [];
  let reply = "";
  for (const block of content) {
    if (block.type === "text" && block.text) {
      reply += block.text;
    }
    if (block.type === "tool_use" && block.name && isCopilotToolId(block.name)) {
      const input = (block.input ?? {}) as { aliasId?: string };
      const params: CopilotActionParams =
        block.name === "rotate_alias" && typeof input.aliasId === "string"
          ? { aliasId: input.aliasId }
          : {};
      toolCalls.push({ toolId: block.name, params });
    }
  }
  return { reply: reply.trim(), toolCalls };
}
