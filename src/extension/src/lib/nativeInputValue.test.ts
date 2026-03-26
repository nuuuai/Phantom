/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import {
  setNativeInputValue,
  syncNativeInputAfterValueChange,
} from "./nativeInputValue.js";

describe("setNativeInputValue", () => {
  it("sets input value using the native prototype setter path", () => {
    const input = document.createElement("input");
    setNativeInputValue(input, "hello@phantom.test");
    expect(input.value).toBe("hello@phantom.test");
  });
});

describe("syncNativeInputAfterValueChange", () => {
  it("dispatches input and change after setting value", () => {
    const input = document.createElement("input");
    const names: string[] = [];
    input.addEventListener("input", () => names.push("input"));
    input.addEventListener("change", () => names.push("change"));
    input.addEventListener("blur", () => names.push("blur"));
    syncNativeInputAfterValueChange(input, "x");
    expect(input.value).toBe("x");
    expect(names).toEqual(["input", "change", "blur"]);
  });
});
