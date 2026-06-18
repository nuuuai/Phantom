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
  "generate_alias",
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
  {
    type: "function" as const,
    function: {
      name: "generate_alias",
      description:
        "Propose creating a new alias (email, username, or phone). Requires user confirmation. Password aliases are not supported via Copilot.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["email", "username", "phone"] },
          category: {
            type: "string",
            enum: [
              "shopping",
              "social",
              "finance",
              "work",
              "dating",
              "newsletter",
              "temp",
            ],
          },
          serviceName: { type: "string" },
          serviceUrl: { type: "string" },
        },
        required: ["type", "category"],
        additionalProperties: false,
      },
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
  {
    name: "generate_alias",
    description:
      "Propose creating a new alias. Requires confirmation. No password aliases.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["email", "username", "phone"] },
        category: { type: "string" },
        serviceName: { type: "string" },
        serviceUrl: { type: "string" },
      },
      required: ["type", "category"],
      additionalProperties: false,
    },
  },
];

const ALIAS_TYPES = new Set(["email", "username", "phone"]);
const ALIAS_CATEGORIES = new Set([
  "shopping",
  "social",
  "finance",
  "work",
  "dating",
  "newsletter",
  "temp",
]);

function parseToolParams(
  toolId: CopilotToolId,
  raw: Record<string, unknown>
): CopilotActionParams {
  if (toolId === "rotate_alias" && typeof raw.aliasId === "string") {
    return { aliasId: raw.aliasId };
  }
  if (
    toolId === "generate_alias" &&
    typeof raw.type === "string" &&
    ALIAS_TYPES.has(raw.type) &&
    typeof raw.category === "string" &&
    ALIAS_CATEGORIES.has(raw.category)
  ) {
    return {
      type: raw.type as "email" | "username" | "phone",
      category: raw.category as
        | "shopping"
        | "social"
        | "finance"
        | "work"
        | "dating"
        | "newsletter"
        | "temp",
      serviceName:
        typeof raw.serviceName === "string" ? raw.serviceName : undefined,
      serviceUrl: typeof raw.serviceUrl === "string" ? raw.serviceUrl : undefined,
    };
  }
  return {};
}

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
      const parsed = JSON.parse(tc.function?.arguments ?? "{}") as Record<
        string,
        unknown
      >;
      params = parseToolParams(name, parsed);
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
      const input = (block.input ?? {}) as Record<string, unknown>;
      const params = parseToolParams(block.name, input);
      toolCalls.push({ toolId: block.name, params });
    }
  }
  return { reply: reply.trim(), toolCalls };
}
