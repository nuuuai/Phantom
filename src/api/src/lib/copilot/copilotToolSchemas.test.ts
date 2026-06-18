import { describe, expect, it } from "vitest";
import {
  parseAnthropicToolCalls,
  parseOpenAiToolCalls,
} from "../copilot/copilotToolSchemas.js";

describe("copilotToolSchemas", () => {
  it("parses OpenAI tool calls", () => {
    const result = parseOpenAiToolCalls({
      content: "I'll start a scan.",
      tool_calls: [
        {
          function: { name: "start_broker_scan", arguments: "{}" },
        },
      ],
    });
    expect(result.toolCalls[0]?.toolId).toBe("start_broker_scan");
    expect(result.reply).toContain("scan");
  });

  it("parses Anthropic tool_use blocks", () => {
    const result = parseAnthropicToolCalls([
      { type: "text", text: "Rotating alias." },
      {
        type: "tool_use",
        name: "rotate_alias",
        input: { aliasId: "alias-123" },
      },
    ]);
    expect(result.toolCalls[0]?.toolId).toBe("rotate_alias");
    expect(result.toolCalls[0]?.params).toEqual({ aliasId: "alias-123" });
  });
});
