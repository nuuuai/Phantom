import { act } from "react";
import { createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { useEscapeKey } from "./useEscapeKey.js";

function TestHarness({ enabled }: { enabled: boolean }) {
  const [count, setCount] = useState(0);
  useEscapeKey(enabled, () => setCount((c) => c + 1));
  return createElement("span", { "data-count": String(count) });
}

describe("useEscapeKey", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    if (root) {
      act(() => {
        root!.unmount();
      });
    }
    root = undefined;
    container?.remove();
    container = undefined;
  });

  it("invokes callback on Escape when enabled", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(createElement(TestHarness, { enabled: true }));
    });
    const span = container.querySelector("span");
    expect(span?.getAttribute("data-count")).toBe("0");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(span?.getAttribute("data-count")).toBe("1");
  });

  it("does not invoke when disabled", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(createElement(TestHarness, { enabled: false }));
    });
    const span = container.querySelector("span");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(span?.getAttribute("data-count")).toBe("0");
  });
});
