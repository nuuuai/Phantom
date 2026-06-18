import { buildBillingValueSummary, buildPriorityActions } from "@phantom/shared";
import { buildIntelligenceContext } from "./buildIntelligenceContext.js";
import { isOverviewDemoMetricsEnabled } from "./envOverviewDemo.js";

export async function buildBillingValueSummaryForUser(userId: string) {
  const ctx = await buildIntelligenceContext(userId);
  const demo = isOverviewDemoMetricsEnabled();
  const priorityActions = buildPriorityActions(ctx);

  return buildBillingValueSummary({
    brokersRemoved: ctx.brokersRemoved,
    activeAliases: ctx.activeAliases,
    darkWebAlerts: ctx.darkWebAlerts,
    priorityActionCount: priorityActions.length,
    scamsEngaged: demo ? 342 : 0,
    callsScreened: demo ? 1284 : 0,
  });
}
