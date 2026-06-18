import { describe, expect, it } from "vitest";
import { detectCopilotToolIntent } from "./detectCopilotToolIntent.js";

describe("detectCopilotToolIntent", () => {
  it("detects broker scan start", () => {
    expect(detectCopilotToolIntent("Run a broker scan for me")).toEqual({
      toolId: "start_broker_scan",
    });
  });

  it("detects alias rotation", () => {
    expect(detectCopilotToolIntent("Rotate my compromised aliases")).toEqual({
      toolId: "rotate_alias",
    });
  });

  it("detects bulk broker removals", () => {
    expect(
      detectCopilotToolIntent("Submit removals for all brokers")
    ).toEqual({ toolId: "request_broker_removals" });
  });

  it("detects alias generation", () => {
    expect(detectCopilotToolIntent("Create a shopping alias for Amazon")).toEqual({
      toolId: "generate_alias",
      params: expect.objectContaining({
        type: "email",
        category: "shopping",
        serviceName: "amazon",
      }),
    });
  });

  it("returns null for general questions", () => {
    expect(detectCopilotToolIntent("Why is my risk score 67?")).toBeNull();
  });
});
