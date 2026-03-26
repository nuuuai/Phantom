/** Invalidates every `aliasDetail()` query (list/detail views after mutations). */
export const aliasDetailAll = ["alias-detail"] as const;

/** Prefix for all aliases list queries (`aliasesList`). */
export const aliasesAll = ["aliases"] as const;

/** Prefix for vault password list queries. */
export const vaultAll = ["vault"] as const;

/** Vault E2E blob sync (extension ↔ dashboard). */
export const vaultSyncAll = ["vault-sync"] as const;

/** Prefix for `dashboardOverview` metrics. */
export const dashboardOverviewAll = ["dashboard-overview"] as const;

export const brokerScanResultsAll = ["broker-scan-results"] as const;
export const brokerScanCatalogAll = ["broker-scan-catalog"] as const;
export const brokerScanSummaryAll = ["broker-scan-summary"] as const;

/** Prefix for all inbox list queries (`emailInbox`). */
export const emailInboxAll = ["email-inbox"] as const;

export const queryKeys = {
  aliasDetailAll,
  aliasesAll,
  vaultAll,
  vaultSyncAll,
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
  emailInbox: (
    accessToken: string | null,
    q?: string,
    unreadOnly?: boolean
  ) =>
    ["email-inbox", accessToken, q ?? "", unreadOnly ?? false] as const,
  billingStatus: (accessToken: string | null) =>
    ["billing-status", accessToken] as const,
  phoneProvider: (accessToken: string | null) =>
    ["phone-provider", accessToken] as const,
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
  vaultSync: (accessToken: string | null, dataUpdatedAt: number) =>
    ["vault-sync", accessToken, dataUpdatedAt] as const,
};
