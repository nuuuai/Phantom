import type { RemovalMethod } from "@prisma/client";

/**
 * Simulated probability (per advance tick) that a removal_submitted row becomes
 * removal_confirmed. Tuned so aggregate progress feels plausible vs avgRemovalDays
 * and removalMethod (API/email faster than mail in this model).
 */
export function confirmationProbabilityForBroker(
  removalMethod: RemovalMethod,
  avgRemovalDays: number
): number {
  const base = 0.12;
  const methodMul =
    removalMethod === "api"
      ? 1.45
      : removalMethod === "email"
        ? 1.25
        : removalMethod === "form"
          ? 1.0
          : 0.55;
  const days = Math.max(7, Math.min(45, avgRemovalDays));
  const daysMul = 14 / days;
  const p = base * methodMul * daysMul;
  return Math.min(0.42, p);
}

/** Simulated probability (per tick) that a confirmed removal re-appears (re_listed). */
export function relistProbabilityForBroker(avgRemovalDays: number): number {
  const base = 0.015;
  const days = Math.max(7, Math.min(45, avgRemovalDays));
  return base * (14 / days);
}
