export const queryKeys = {
  dashboardOverview: (accessToken: string | null) =>
    ["dashboard-overview", accessToken] as const,
};
