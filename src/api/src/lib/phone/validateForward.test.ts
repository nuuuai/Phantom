import { describe, expect, it } from "vitest";
import { parsePhoneForwardTo } from "./validateForward.js";

describe("parsePhoneForwardTo", () => {
  it("empty to null", () => {
    expect(parsePhoneForwardTo("")).toEqual({ ok: true, value: null });
    expect(parsePhoneForwardTo("   ")).toEqual({ ok: true, value: null });
  });

  it("valid E.164", () => {
    expect(parsePhoneForwardTo("+15551234567")).toEqual({
      ok: true,
      value: "+15551234567",
    });
  });

  it("invalid rejected", () => {
    const r = parsePhoneForwardTo("555-123-4567");
    expect(r.ok).toBe(false);
  });
});
