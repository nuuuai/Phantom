import { describe, expect, it } from "vitest";
import { simulateCallGuardLiveEvents } from "./simulateCallGuardLive.js";

describe("simulateCallGuardLiveEvents", () => {
  it("yields deterministic phases ending in complete", () => {
    const events = [...simulateCallGuardLiveEvents("user-stable")];
    expect(events[0]?.phase).toBe("ringing");
    expect(events.at(-1)?.phase).toBe("complete");
    expect(events.at(-1)?.demoMode).toBe(true);
  });
});
