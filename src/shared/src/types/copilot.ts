/** LLM Copilot chat API types. */

import type { CopilotPendingAction } from "./copilotTools.js";

export type CopilotReplyMode = "llm" | "rules";

export interface CopilotChatRequest {
  message: string;
}

export interface CopilotChatResponse {
  reply: string;
  mode: CopilotReplyMode;
  /** Set when mode is llm — e.g. gpt-4o-mini */
  model?: string;
  /** Write action awaiting user confirmation in the dashboard. */
  pendingAction?: CopilotPendingAction;
}

export interface CopilotStatusResponse {
  enabled: boolean;
  provider: "openai" | "anthropic" | null;
  model: string | null;
}
