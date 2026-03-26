/**
 * Synthetic Sword / weekly-chart numbers for demos or screenshots only.
 * Production: leave both unset → honest zeros in `buildDashboardOverview`.
 */
export function isOverviewDemoMetricsEnabled(): boolean {
  return (
    process.env.DASHBOARD_DEMO_METRICS === "1" ||
    process.env.OVERVIEW_DEMO_METRICS === "1"
  );
}
