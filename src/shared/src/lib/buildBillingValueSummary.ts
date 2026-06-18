import type { BillingValueSummary } from "../types/billingValue.js";

export interface BillingValueInput {
  brokersRemoved: number;
  activeAliases: number;
  darkWebAlerts: number;
  priorityActionCount: number;
  scamsEngaged: number;
  callsScreened: number;
}

/** Estimates Pro ROI from operational metrics — heuristic, no PII. */
export function buildBillingValueSummary(
  input: BillingValueInput
): BillingValueSummary {
  const autopilotActionsEstimate =
    input.brokersRemoved +
    Math.min(input.darkWebAlerts, 5) +
    (input.scamsEngaged > 0 ? 1 : 0);

  const hoursSavedEstimate = Math.max(
    1,
    input.brokersRemoved * 2 +
      input.priorityActionCount +
      Math.floor(input.callsScreened / 200)
  );

  const headline =
    hoursSavedEstimate >= 8
      ? `Pro likely saved ~${hoursSavedEstimate} hours of manual privacy work this month`
      : "Pro automates broker removals, alias hygiene, and breach monitoring";

  return {
    brokersRemoved: input.brokersRemoved,
    activeAliases: input.activeAliases,
    darkWebAlerts: input.darkWebAlerts,
    autopilotActionsEstimate,
    hoursSavedEstimate,
    headline,
  };
}
