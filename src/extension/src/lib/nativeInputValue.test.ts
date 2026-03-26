/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { setNativeInputValue } from "./nativeInputValue.js";

describe("setNativeInputValue", () => {
  it("sets input value using the native prototype setter path", () => {
    const input = document.createElement("input");
    setNativeInputValue(input, "hello@phantom.test");
    expect(input.value).toBe("hello@phantom.test");
  });
});
