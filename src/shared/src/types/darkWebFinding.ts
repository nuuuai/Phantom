/** Public API shape — no raw secrets; `identifierDisplay` is masked metadata only. */
export type DarkWebSeverity = "low" | "medium" | "high" | "critical";

export type DarkWebFindingStatus = "open" | "dismissed";

export interface DarkWebFindingPublic {
  id: string;
  severity: DarkWebSeverity;
  status: DarkWebFindingStatus;
  title: string;
  summary: string;
  sourceLabel: string;
  breachName: string | null;
  identifierType: string;
  identifierDisplay: string;
  recommendedAction: string;
  detectedAt: string;
  dismissedAt: string | null;
}

export interface DarkWebFindingsSummary {
  openCount: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  /** True when the account is not on a paid plan — list/refresh are gated. */
  tierGated: boolean;
}

/** Paginated list from `GET /api/dark-web/findings`. */
export interface DarkWebFindingsListResponse {
  items: DarkWebFindingPublic[];
  tierGated: boolean;
  total: number;
  limit: number;
  offset: number;
}

export interface DarkWebRefreshResult {
  /** New rows inserted this run (deduped against existing `dedupeKey`). */
  inserted: number;
  /** True when `DARK_WEB_HIBP_API_KEY` (or equivalent) is missing — no external call. */
  skippedNoApiKey: boolean;
  /** Human-readable note for operators (never includes secrets). */
  message: string;
}
