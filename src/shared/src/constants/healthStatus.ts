import type { HealthStatus } from "../types/alias.js";

export const HEALTH_STATUS_VALUES: readonly HealthStatus[] = [
  "healthy",
  "warning",
  "compromised",
  "quarantined",
];
