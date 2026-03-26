import { describe, expect, it } from "vitest";
import { MESSAGE_GENERATE_ALIAS, MESSAGE_LOGOUT } from "./messages";

describe("messages", () => {
  it("defines generate alias message", () => {
    expect(MESSAGE_GENERATE_ALIAS).toBe("phantom:generate-alias");
  });

  it("defines logout message", () => {
    expect(MESSAGE_LOGOUT).toBe("phantom:logout");
  });
});
