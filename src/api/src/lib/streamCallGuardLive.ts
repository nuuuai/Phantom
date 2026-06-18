import type { CallGuardLiveEvent } from "@phantom/shared";
import { simulateCallGuardLiveEvents } from "@phantom/shared";
import type { Response } from "express";

const PHASE_DELAY_MS: Record<string, number> = {
  ringing: 600,
  screening: 800,
  transcript: 900,
  decision: 500,
  complete: 0,
};

export async function streamCallGuardLiveDemo(
  userId: string,
  res: Response
): Promise<void> {
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  for (const event of simulateCallGuardLiveEvents(userId)) {
    const payload: CallGuardLiveEvent = event;
    res.write(`${JSON.stringify(payload)}\n`);
    const delay = PHASE_DELAY_MS[event.phase] ?? 400;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  res.end();
}
