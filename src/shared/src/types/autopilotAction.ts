export type AutopilotActionKindPublic =
  | "alias_rotated"
  | "alias_warning"
  | "broker_removal_submitted"
  | "ftc_complaint_queued"
  | "breach_playbook_triggered";

export interface AutopilotActionRecord {
  id: string;
  kind: AutopilotActionKindPublic;
  title: string;
  description: string;
  refId: string | null;
  createdAt: string;
}

export interface AutopilotActionsListResponse {
  items: readonly AutopilotActionRecord[];
}
