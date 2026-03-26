import { describe, expect, it } from "vitest";
import { computePhantomInboundDedupeKey } from "./inboundWebhookDedupe.js";

describe("computePhantomInboundDedupeKey", () => {
  const t0 = new Date("2025-03-01T12:00:00.000Z");

  it("is deterministic for the same inputs", () => {
    const a = computePhantomInboundDedupeKey(
      "a@phantom.id",
      "b@x.com",
      "Hi",
      t0,
      "body",
    );
    const b = computePhantomInboundDedupeKey(
      "a@phantom.id",
      "b@x.com",
      "Hi",
      t0,
      "body",
    );
    expect(a).toBe(b);
    expect(a.startsWith("phantom:v1:")).toBe(true);
  });

  it("normalizes alias address case", () => {
    const a = computePhantomInboundDedupeKey(
      "A@Phantom.ID",
      "b@x.com",
      "Hi",
      t0,
      "",
    );
    const b = computePhantomInboundDedupeKey(
      "a@phantom.id",
      "b@x.com",
      "Hi",
      t0,
      "",
    );
    expect(a).toBe(b);
  });

  it("changes when snippet changes", () => {
    const a = computePhantomInboundDedupeKey(
      "a@phantom.id",
      "b@x.com",
      "Hi",
      t0,
      "one",
    );
    const b = computePhantomInboundDedupeKey(
      "a@phantom.id",
      "b@x.com",
      "Hi",
      t0,
      "two",
    );
    expect(a).not.toBe(b);
  });
});
