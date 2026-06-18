import type { CallGuardLiveEvent } from "../types/callGuardLive.js";
import { createSeededRandom, hashUserSeed } from "./hashUserSeed.js";

const DEMO_TRANSCRIPT = [
  "Hello, this is the vehicle warranty department.",
  "Your coverage is about to expire.",
  "We need to verify your identity with your social security number.",
  "Press one to speak with a representative immediately.",
] as const;

/**
 * Deterministic Call Guard live-screening demo events for SSE mock stream.
 * No real phone numbers or PII — synthetic caller label only.
 */
export function* simulateCallGuardLiveEvents(
  userId: string
): Generator<CallGuardLiveEvent> {
  const rand = createSeededRandom(hashUserSeed(`${userId}:call-guard-live`));
  const callerLabel = rand() > 0.5 ? "Vehicle warranty" : "Bank security";
  let elapsed = 0;

  yield {
    phase: "ringing",
    transcriptChunk: null,
    scamConfidence: 0,
    decision: null,
    callerLabel,
    elapsedMs: elapsed,
    demoMode: true,
  };

  elapsed += 800;
  yield {
    phase: "screening",
    transcriptChunk: "Call Guard engaged — analyzing caller intent…",
    scamConfidence: 12,
    decision: "screen",
    callerLabel,
    elapsedMs: elapsed,
    demoMode: true,
  };

  let confidence = 18;
  for (const chunk of DEMO_TRANSCRIPT) {
    elapsed += 1200 + Math.floor(rand() * 400);
    confidence = Math.min(96, confidence + 18 + Math.floor(rand() * 12));
    yield {
      phase: "transcript",
      transcriptChunk: chunk,
      scamConfidence: confidence,
      decision: confidence >= 50 ? "screen" : null,
      callerLabel,
      elapsedMs: elapsed,
      demoMode: true,
    };
  }

  elapsed += 600;
  const finalConfidence = Math.max(82, confidence);
  const decision = finalConfidence >= 80 ? "block" : "screen";

  yield {
    phase: "decision",
    transcriptChunk: null,
    scamConfidence: finalConfidence,
    decision,
    callerLabel,
    elapsedMs: elapsed,
    demoMode: true,
  };

  elapsed += 400;
  yield {
    phase: "complete",
    transcriptChunk:
      decision === "block"
        ? "Call blocked — high-confidence scam pattern."
        : "Call screened — user notified with transcript.",
    scamConfidence: finalConfidence,
    decision,
    callerLabel,
    elapsedMs: elapsed,
    demoMode: true,
  };
}
