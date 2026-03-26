import { useEffect, useRef } from "react";

const MAIN_CONTENT_ID = "main-content";

/**
 * When `isOpen` transitions from true → false, move focus to `#main-content`
 * so keyboard users land back in the page landmark after closing a modal/dialog.
 */
export function useRestoreFocusToMainOnClose(isOpen: boolean): void {
  const prevOpen = useRef(false);
  useEffect(() => {
    if (prevOpen.current && !isOpen) {
      document.getElementById(MAIN_CONTENT_ID)?.focus();
    }
    prevOpen.current = isOpen;
  }, [isOpen]);
}
