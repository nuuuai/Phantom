import type { CallGuardActiveSession } from "../types/callGuardActive.js";
import { createSeededRandom, hashUserSeed } from "./hashUserSeed.js";

/** Deterministic active-call mock for Call Guard Phase 2 architecture preview. */
export function generateActiveCallGuardSession(
  userId: string,
  demoMode: boolean
): CallGuardActiveSession | null {
  if (!demoMode) return null;

  const rand = createSeededRandom(hashUserSeed(`${userId}:call-guard-active`));
  if (rand() < 0.55) return null;

  const phases: CallGuardActiveSession["phase"][] = [
    "ringing",
    "screening",
    "transcript",
  ];
  const phase = phases[Math.floor(rand() * phases.length)] ?? "screening";

  return {
    sessionId: `cg-active-${Math.floor(rand() * 0xffffff).toString(16)}`,
    callerLabel: rand() > 0.5 ? "Medicare services" : "Package delivery",
    scamConfidence: Math.round(40 + rand() * 55),
    phase,
    startedAt: new Date(Date.now() - Math.floor(rand() * 120_000)).toISOString(),
    demoMode: true,
  };
}
