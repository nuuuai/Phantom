import type { CopilotChatResponse, CopilotToolId } from "@phantom/shared";
import {
  buildDailyBrief,
  buildPriorityActions,
  buildRiskFactors,
  detectCopilotToolIntent,
  resolveCopilotResponse,
} from "@phantom/shared";
import { buildIntelligenceContext } from "../buildIntelligenceContext.js";
import { listRotationCandidatesForUser } from "../listRotationCandidates.js";
import { callCopilotLlm } from "./callCopilotLlm.js";
import type { CopilotLlmToolCall } from "./copilotToolSchemas.js";
import type { CopilotAccountSnapshot } from "./copilotPrompt.js";
import { buildCopilotPendingAction } from "./executeCopilotAction.js";
import { getCopilotLlmConfig } from "./envCopilot.js";

function appendActionUnavailable(reply: string, toolId: CopilotToolId): string {
  if (toolId === "rotate_alias") {
    return `${reply}\n\nNo email, phone, or username aliases need rotation right now. Password vault entries must be rotated from the Vault page.`;
  }
  if (toolId === "request_broker_removals") {
    return `${reply}\n\nBroker removals require Phantom Pro and at least one exposed broker from your latest scan.`;
  }
  return reply;
}

async function attachPendingAction(
  userId: string,
  reply: string,
  toolCall: CopilotLlmToolCall | null,
  fallbackMessage: string | null
): Promise<Pick<CopilotChatResponse, "reply" | "pendingAction">> {
  if (toolCall) {
    const pendingAction = await buildCopilotPendingAction(userId, {
      toolId: toolCall.toolId,
      params: toolCall.params,
    });
    if (!pendingAction) {
      return {
        reply: appendActionUnavailable(
          reply || "I can propose that action, but it is not available right now.",
          toolCall.toolId
        ),
      };
    }
    const base = reply || pendingAction.description;
    return {
      reply: `${base}\n\nReady to run: "${pendingAction.title}" — confirm below to execute.`,
      pendingAction,
    };
  }

  if (fallbackMessage) {
    const intent = detectCopilotToolIntent(fallbackMessage);
    if (!intent) return { reply };
    const pendingAction = await buildCopilotPendingAction(userId, intent);
    if (!pendingAction) {
      return { reply: appendActionUnavailable(reply, intent.toolId) };
    }
    return {
      reply: `${reply}\n\nReady to run: "${pendingAction.title}" — confirm below to execute.`,
      pendingAction,
    };
  }

  return { reply };
}

export async function runCopilotChat(
  userId: string,
  message: string
): Promise<CopilotChatResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { reply: "Ask a question about your privacy posture.", mode: "rules" };
  }

  const ctx = await buildIntelligenceContext(userId);
  const riskFactors = buildRiskFactors(ctx);
  const priorityActions = buildPriorityActions(ctx);
  const dailyBrief = buildDailyBrief(ctx);
  const { candidates: rotationCandidates } =
    await listRotationCandidatesForUser(userId);

  const copilotCtx = { ...ctx, riskFactors, rotationCandidates };

  const snapshot: CopilotAccountSnapshot = {
    tier: ctx.userTier,
    riskScore: ctx.riskScore,
    riskFactors,
    priorityActions,
    dailyBrief,
    activeAliases: ctx.activeAliases,
    aliasesHealthy: ctx.aliasesHealthy,
    aliasesWarning: ctx.aliasesWarning,
    aliasesCompromised: ctx.aliasesCompromised,
    passwordAliasCount: ctx.passwordAliasCount,
    brokersFound: ctx.brokersFound,
    brokersRemoved: ctx.brokersRemoved,
    brokersPending: ctx.brokersPending,
    brokersRelisted: ctx.brokersRelisted,
    hasBrokerScan: ctx.hasBrokerScan,
    darkWebAlerts: ctx.darkWebAlerts,
    unreadInbox: ctx.unreadInbox,
    metricsDemoMode: ctx.metricsDemoMode,
  };

  const llm = getCopilotLlmConfig();
  if (!llm) {
    const baseReply = resolveCopilotResponse(trimmed, copilotCtx);
    const enriched = await attachPendingAction(userId, baseReply, null, trimmed);
    return { ...enriched, mode: "rules" };
  }

  try {
    const llmResult = await callCopilotLlm(llm, snapshot, trimmed);
    const toolCall = llmResult.toolCalls[0] ?? null;
    const enriched = await attachPendingAction(
      userId,
      llmResult.reply,
      toolCall,
      toolCall ? null : trimmed
    );
    return { ...enriched, mode: "llm", model: llm.model };
  } catch {
    const baseReply = resolveCopilotResponse(trimmed, copilotCtx);
    const enriched = await attachPendingAction(userId, baseReply, null, trimmed);
    return { ...enriched, mode: "rules" };
  }
}
