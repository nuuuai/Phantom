import { useEffect, useRef } from "react";

/**
 * Invokes `onEscape` when Escape is pressed while `enabled` is true.
 * Uses a ref for the callback so the listener stays stable across renders.
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void): void {
  const ref = useRef(onEscape);
  ref.current = onEscape;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ref.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
