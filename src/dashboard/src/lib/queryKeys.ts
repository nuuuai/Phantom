/** Invalidates every `aliasDetail()` query (list/detail views after mutations). */
export const aliasDetailAll = ["alias-detail"] as const;

/** Prefix for all aliases list queries (`aliasesList`). */
export const aliasesAll = ["aliases"] as const;

/** Prefix for vault password list queries. */
export const vaultAll = ["vault"] as const;

/** Prefix for `dashboardOverview` metrics. */
export const dashboardOverviewAll = ["dashboard-overview"] as const;

export const brokerScanResultsAll = ["broker-scan-results"] as const;
export const brokerScanCatalogAll = ["broker-scan-catalog"] as const;
export const brokerScanSummaryAll = ["broker-scan-summary"] as const;

export const queryKeys = {
  aliasDetailAll,
  aliasesAll,
  vaultAll,
  dashboardOverviewAll,
  brokerScanResultsAll,
  brokerScanCatalogAll,
  brokerScanSummaryAll,
  dashboardOverview: (accessToken: string | null) =>
    ["dashboard-overview", accessToken] as const,
  aliasesList: (
    accessToken: string | null,
    category: string,
    health: string
  ) => ["aliases", accessToken, category, health] as const,
  brokerScanSummary: (accessToken: string | null) =>
    ["broker-scan-summary", accessToken] as const,
  brokerScanResults: (
    accessToken: string | null,
    status: string,
    q: string
  ) => ["broker-scan-results", accessToken, status, q] as const,
  brokerScanCatalog: (accessToken: string | null) =>
    ["broker-scan-catalog", accessToken] as const,
  userMe: (accessToken: string | null) => ["user-me", accessToken] as const,
  emailInbox: (accessToken: string | null) =>
    ["email-inbox", accessToken] as const,
  aliasDetail: (accessToken: string | null, id: string | undefined) =>
    ["alias-detail", accessToken, id] as const,
  notifications: (accessToken: string | null) =>
    ["notifications", accessToken] as const,
  notificationCount: (accessToken: string | null) =>
    ["notification-count", accessToken] as const,
  notificationPrefs: (accessToken: string | null) =>
    ["notification-prefs", accessToken] as const,
  vaultList: (accessToken: string | null, category: string) =>
    ["vault", accessToken, category] as const,
};
