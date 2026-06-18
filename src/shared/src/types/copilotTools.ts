/** Copilot tools that can read data or propose confirmed writes. */

export type CopilotToolId =
  | "start_broker_scan"
  | "rotate_alias"
  | "request_broker_removals";

export interface CopilotRotateAliasParams {
  aliasId: string;
}

export type CopilotActionParams =
  | Record<string, never>
  | CopilotRotateAliasParams;

export interface CopilotPendingAction {
  toolId: CopilotToolId;
  title: string;
  description: string;
  params: CopilotActionParams;
}

export interface CopilotConfirmRequest {
  toolId: CopilotToolId;
  params?: CopilotActionParams;
}

export interface CopilotConfirmResponse {
  message: string;
  scanId?: string;
  aliasId?: string;
  removalsSubmitted?: number;
}

export interface CopilotToolIntent {
  toolId: CopilotToolId;
  params?: CopilotActionParams;
}
