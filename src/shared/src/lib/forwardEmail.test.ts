import { describe, expect, it } from "vitest";
import {
  isValidForwardEmailInput,
  parseForwardToEmailPatchBody,
} from "./forwardEmail.js";

describe("parseForwardToEmailPatchBody", () => {
  it("requires forwardToEmail key", () => {
    const r = parseForwardToEmailPatchBody({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("required");
  });

  it("accepts null", () => {
    expect(parseForwardToEmailPatchBody({ forwardToEmail: null })).toEqual({
      ok: true,
      value: null,
    });
  });

  it("treats empty string as clear", () => {
    expect(parseForwardToEmailPatchBody({ forwardToEmail: "  " })).toEqual({
      ok: true,
      value: null,
    });
  });

  it("normalizes valid email to lowercase", () => {
    expect(
      parseForwardToEmailPatchBody({ forwardToEmail: "User@Example.com" })
    ).toEqual({ ok: true, value: "user@example.com" });
  });

  it("rejects invalid email strings", () => {
    const r = parseForwardToEmailPatchBody({ forwardToEmail: "not-email" });
    expect(r.ok).toBe(false);
  });

  it("rejects non-string forwardToEmail", () => {
    const r = parseForwardToEmailPatchBody({ forwardToEmail: 1 });
    expect(r.ok).toBe(false);
  });
});

describe("isValidForwardEmailInput", () => {
  it("matches patch parser for string inputs", () => {
    expect(isValidForwardEmailInput("")).toBe(true);
    expect(isValidForwardEmailInput("a@b.co")).toBe(true);
    expect(isValidForwardEmailInput("not-an-email")).toBe(false);
  });
});
