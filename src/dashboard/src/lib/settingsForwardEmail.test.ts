import { describe, expect, it } from "vitest";
import { isValidForwardEmailInput } from "./settingsForwardEmail.js";

describe("settingsForwardEmail", () => {
  it("accepts empty (clear) and plausible addresses", () => {
    expect(isValidForwardEmailInput("")).toBe(true);
    expect(isValidForwardEmailInput("a@b.co")).toBe(true);
  });

  it("rejects obvious non-emails", () => {
    expect(isValidForwardEmailInput("not-an-email")).toBe(false);
    expect(isValidForwardEmailInput("a@b")).toBe(false);
  });
});
