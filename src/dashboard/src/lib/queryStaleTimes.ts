/**
 * React Query `staleTime` defaults (ms). Keep list/detail keys aligned with
 * `queryKeys` so cached data matches filters; logout clears cache via `queryClient.clear()`.
 */
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
} as const;
