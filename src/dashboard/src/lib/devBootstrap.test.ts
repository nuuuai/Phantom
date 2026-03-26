import { afterEach, describe, expect, it } from "vitest";
import {
  SKIP_DEV_BOOTSTRAP_KEY,
  clearSkipDevBootstrap,
  setSkipDevBootstrap,
  shouldSkipDevBootstrap,
} from "./devBootstrap.js";

describe("devBootstrap", () => {
  afterEach(() => {
    sessionStorage.removeItem(SKIP_DEV_BOOTSTRAP_KEY);
  });

  it("shouldSkipDevBootstrap is false when not set", () => {
    expect(shouldSkipDevBootstrap()).toBe(false);
  });

  it("setSkipDevBootstrap makes shouldSkipDevBootstrap true", () => {
    setSkipDevBootstrap();
    expect(shouldSkipDevBootstrap()).toBe(true);
  });

  it("clearSkipDevBootstrap clears flag", () => {
    setSkipDevBootstrap();
    clearSkipDevBootstrap();
    expect(shouldSkipDevBootstrap()).toBe(false);
  });
});
