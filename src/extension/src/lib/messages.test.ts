import { describe, expect, it } from "vitest";
import { MESSAGE_GENERATE_ALIAS } from "./messages";

describe("messages", () => {
  it("defines generate alias message", () => {
    expect(MESSAGE_GENERATE_ALIAS).toBe("phantom:generate-alias");
  });
});
