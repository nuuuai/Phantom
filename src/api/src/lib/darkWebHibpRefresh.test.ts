import { describe, expect, it } from "vitest";
import { maskEmailForDisplay } from "./darkWebHibpRefresh.js";

describe("maskEmailForDisplay", () => {
  it("masks local part and keeps domain", () => {
    expect(maskEmailForDisplay("alice@example.com")).toBe("a***@example.com");
  });

  it("handles short local part", () => {
    expect(maskEmailForDisplay("a@b.co")).toBe("a***@b.co");
  });
});
