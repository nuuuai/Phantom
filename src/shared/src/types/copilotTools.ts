/** Copilot tools that can read data or propose confirmed writes. */

import type { AliasCategory } from "./alias.js";

export type CopilotAliasCreateType = "email" | "username" | "phone";

export type CopilotToolId =
  | "start_broker_scan"
  | "rotate_alias"
  | "request_broker_removals"
  | "generate_alias";

export interface CopilotRotateAliasParams {
  aliasId: string;
}

export interface CopilotGenerateAliasParams {
  type: CopilotAliasCreateType;
  category: AliasCategory;
  serviceName?: string;
  serviceUrl?: string;
}

export type CopilotActionParams =
  | Record<string, never>
  | CopilotRotateAliasParams
  | CopilotGenerateAliasParams;

export function isCopilotGenerateAliasParams(
  params: CopilotActionParams | undefined
): params is CopilotGenerateAliasParams {
  if (!params || !("type" in params) || !("category" in params)) return false;
  const t = params.type;
  return (
    (t === "email" || t === "username" || t === "phone") &&
    typeof params.category === "string"
  );
}

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
