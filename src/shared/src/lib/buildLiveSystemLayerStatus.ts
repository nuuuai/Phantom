import type { SystemLayerStatus } from "../types/dashboardOverview.js";

export interface LiveSystemLayerInput {
  activeAliases: number;
  aliasesHealthy: number;
  brokersFound: number;
  brokersRemoved: number;
  brokersPending: number;
  riskScore: number;
  intelligenceCount: number;
  darkWebAlerts: number;
  unreadInbox: number;
  hasBrokerScan: boolean;
  autopilotAutoRotate: boolean;
  autopilotAutoQuarantine: boolean;
  autopilotAutoComplaint: boolean;
  autopilotAutoRemoval: boolean;
}

/** Production system layer strip — live counts instead of Phase 2 placeholders. */
export function buildLiveSystemLayerStatus(
  input: LiveSystemLayerInput
): readonly SystemLayerStatus[] {
  const shield =
    input.activeAliases === 0
      ? "No active aliases — create one to start shielding"
      : `${input.aliasesHealthy}/${input.activeAliases} aliases healthy${
          input.hasBrokerScan
            ? ` · ${String(input.brokersRemoved)}/${String(input.brokersFound)} broker removals`
            : ""
        }`;

  const brainParts = [`Risk ${String(input.riskScore)}/100`];
  if (input.intelligenceCount > 0) {
    brainParts.push(`${String(input.intelligenceCount)} proactive signal(s)`);
  }
  if (input.unreadInbox > 0) {
    brainParts.push(`${String(input.unreadInbox)} unread inbox`);
  }
  if (input.darkWebAlerts > 0) {
    brainParts.push(`${String(input.darkWebAlerts)} breach alert(s)`);
  }

  const sword = "Call Guard MVP — demo screening until PSTN ships";

  const autopilotOn = [
    input.autopilotAutoRotate ? "auto-rotate" : null,
    input.autopilotAutoQuarantine ? "auto-quarantine" : null,
    input.autopilotAutoRemoval ? "auto-removal" : null,
    input.autopilotAutoComplaint ? "auto-complaint" : null,
  ].filter(Boolean);

  let autopilot: string;
  if (autopilotOn.length > 0) {
    autopilot = `${autopilotOn.join(" · ")} enabled`;
  } else if (input.brokersPending > 0) {
    autopilot = `${String(input.brokersPending)} broker removal(s) pending`;
  } else {
    autopilot = "Confirm-before-act mode";
  }

  return [
    { name: "Shield", status: shield, layer: "shield" },
    { name: "Brain", status: brainParts.join(" · "), layer: "brain" },
    { name: "Sword", status: sword, layer: "sword" },
    { name: "Autopilot", status: autopilot, layer: "autopilot" },
  ];
}
