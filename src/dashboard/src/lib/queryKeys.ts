export const queryKeys = {
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
  notifications: (accessToken: string | null) =>
    ["notifications", accessToken] as const,
  notificationCount: (accessToken: string | null) =>
    ["notification-count", accessToken] as const,
};
