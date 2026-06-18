import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../buildIntelligenceContext.js", () => ({
  buildIntelligenceContext: vi.fn(),
}));

vi.mock("./envCopilot.js", () => ({
  getCopilotLlmConfig: vi.fn(),
}));

vi.mock("./callCopilotLlm.js", () => ({
  callCopilotLlm: vi.fn(),
}));

vi.mock("./executeCopilotAction.js", () => ({
  buildCopilotPendingAction: vi.fn(),
}));

import { buildIntelligenceContext } from "../buildIntelligenceContext.js";
import { buildCopilotPendingAction } from "./executeCopilotAction.js";
import { callCopilotLlm } from "./callCopilotLlm.js";
import { getCopilotLlmConfig } from "./envCopilot.js";
import { runCopilotChat } from "./runCopilotChat.js";

const mockCtx = {
  userTier: "free" as const,
  riskScore: 42,
  activeAliases: 3,
  aliasesHealthy: 2,
  aliasesWarning: 1,
  aliasesCompromised: 0,
  passwordAliasCount: 1,
  brokersFound: 5,
  brokersRemoved: 2,
  brokersPending: 2,
  brokersRelisted: 0,
  hasBrokerScan: true,
  darkWebAlerts: 0,
  unreadInbox: 1,
  metricsDemoMode: false,
  inboxPhishingCount: 0,
  inboxSpamCount: 0,
  daysSinceBrokerScan: null,
  topRelistedBrokerName: null,
  inboxVolumeSpike: null,
  rotationCandidateAliasId: null,
};

describe("runCopilotChat", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns rules fallback when LLM disabled", async () => {
    vi.mocked(buildIntelligenceContext).mockResolvedValue(mockCtx);
    vi.mocked(getCopilotLlmConfig).mockReturnValue(null);
    vi.mocked(buildCopilotPendingAction).mockResolvedValue(null);

    const result = await runCopilotChat("user-1", "What is my risk score?");

    expect(result.mode).toBe("rules");
    expect(result.reply.length).toBeGreaterThan(0);
    expect(callCopilotLlm).not.toHaveBeenCalled();
  });

  it("falls back to rules when LLM throws", async () => {
    vi.mocked(buildIntelligenceContext).mockResolvedValue(mockCtx);
    vi.mocked(getCopilotLlmConfig).mockReturnValue({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
    });
    vi.mocked(callCopilotLlm).mockRejectedValue(new Error("upstream"));
    vi.mocked(buildCopilotPendingAction).mockResolvedValue(null);

    const result = await runCopilotChat("user-1", "Rotate my aliases");

    expect(result.mode).toBe("rules");
    expect(result.reply.length).toBeGreaterThan(0);
  });

  it("returns LLM reply when configured", async () => {
    vi.mocked(buildIntelligenceContext).mockResolvedValue(mockCtx);
    vi.mocked(getCopilotLlmConfig).mockReturnValue({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
    });
    vi.mocked(callCopilotLlm).mockResolvedValue({
      reply: "Your risk score is moderate.",
      toolCalls: [],
    });
    vi.mocked(buildCopilotPendingAction).mockResolvedValue(null);

    const result = await runCopilotChat("user-1", "Summarize my posture");

    expect(result.mode).toBe("llm");
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.reply).toContain("Your risk score is moderate.");
  });

  it("attaches pending action for broker scan intent", async () => {
    vi.mocked(buildIntelligenceContext).mockResolvedValue(mockCtx);
    vi.mocked(getCopilotLlmConfig).mockReturnValue(null);
    vi.mocked(buildCopilotPendingAction).mockResolvedValue({
      toolId: "start_broker_scan",
      title: "Run broker exposure scan",
      description: "Scan the broker catalog.",
      params: {},
    });

    const result = await runCopilotChat("user-1", "Run a broker scan for me");

    expect(result.pendingAction?.toolId).toBe("start_broker_scan");
    expect(result.reply.toLowerCase()).toContain("confirm below");
  });
});
