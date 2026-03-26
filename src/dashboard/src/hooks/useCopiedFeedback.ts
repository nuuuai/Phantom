import { useEffect, useState } from "react";

/** Tracks which id was last copied and clears after `durationMs` (for Copy → Copied UI). */
export function useCopiedFeedback(durationMs = 1500) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedId) return;
    const t = window.setTimeout(() => setCopiedId(null), durationMs);
    return () => window.clearTimeout(t);
  }, [copiedId, durationMs]);

  return { copiedId, setCopiedId };
}
