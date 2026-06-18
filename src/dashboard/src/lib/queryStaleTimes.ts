/**
 * React Query `staleTime` defaults (ms). Keep list/detail keys aligned with
 * `queryKeys` so cached data matches filters; logout clears cache via `queryClient.clear()`.
 */
/** Default `gcTime` (ms); keep ≥ largest `staleTime` so back navigation hits cache. */
export const QUERY_GC_TIME_MS = 600_000;

export const STALE = {
  /** Tier / quotas — changes on billing or alias mutations (invalidated). */
  userMe: 60_000,
  /** Stripe subscription snapshot — invalidated after checkout. */
  billingStatus: 120_000,
  /** Overview metrics — invalidated sparingly. */
  dashboardOverview: 60_000,
  /** Broker catalog seed changes rarely. */
  brokerScanCatalog: 300_000,
  /** Scan summary — after runs / removals. */
  brokerScanSummary: 45_000,
  /** Result rows — search + tab filters. */
  brokerScanResults: 20_000,
  /** Inbox list — mark-read should feel fresh. */
  emailInbox: 15_000,
  /** Bell dropdown — polled / marked read. */
  notifications: 20_000,
  /** Settings notification prefs — invalidated after PUT. */
  notificationPrefs: 60_000,
  /** Alias list — category/health filters in key. */
  aliasesList: 30_000,
  /** Dark web findings + summary — refresh invalidates. */
  darkWeb: 30_000,
  callGuard: 45_000,
  scamEngage: 45_000,
  threatIntel: 120_000,
  reports: 60_000,
  family: 60_000,
  inboxSummary: 20_000,
  aliasIntel: 30_000,
  copilotStatus: 120_000,
  vaultSync: 20_000,
} as const;
