export const HEALTH_STATES = [
  "healthy",
  "watch",
  "compromised",
  "quarantined",
] as const;

export type HealthState = (typeof HEALTH_STATES)[number];
