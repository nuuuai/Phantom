import type { CallGuardLiveEvent } from "@phantom/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function CallGuardLiveDemo() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const sword = LAYER_STYLES.sword;
  const [events, setEvents] = useState<CallGuardLiveEvent[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const start = useCallback(async () => {
    if (!accessToken) return;
    stop();
    setEvents([]);
    setError(null);
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await phantomApi.callGuard.streamLive(accessToken, {
        signal: controller.signal,
        onEvent: (event) => {
          setEvents((prev) => [...prev, event]);
        },
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Stream failed");
    } finally {
      setStreaming(false);
    }
  }, [accessToken, stop]);

  useEffect(() => () => stop(), [stop]);

  const latest = events.at(-1);
  const transcript = events
    .filter((e) => e.transcriptChunk)
    .map((e) => e.transcriptChunk)
    .join(" ");

  return (
    <section className="mt-6 rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: sword.text, backgroundColor: sword.bg, borderColor: sword.border }}
            >
              Live preview
            </span>
            <h2 className="font-sans text-sm font-semibold text-ph-text-secondary">
              Screening simulation
            </h2>
          </div>
          <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
            NDJSON stream mock — Phase 2 replaces this with carrier WebSocket feed.
          </p>
        </div>
        <div className="flex gap-2">
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs text-ph-text-secondary"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void start()}
              className="rounded-md border border-ph-accent-border bg-ph-accent-bg px-3 py-1.5 font-sans text-xs font-medium text-ph-accent-light"
            >
              Simulate incoming call
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 font-sans text-xs text-ph-danger">{error}</p>
      ) : null}

      {latest ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-ph-borderSubtle bg-ph-bg-base px-4 py-3">
            <div className="font-mono text-[10px] uppercase text-ph-text-muted">Caller</div>
            <div className="mt-1 font-sans text-sm text-ph-text-primary">
              {latest.callerLabel}
            </div>
          </div>
          <div className="rounded-lg border border-ph-borderSubtle bg-ph-bg-base px-4 py-3">
            <div className="font-mono text-[10px] uppercase text-ph-text-muted">Phase</div>
            <div className="mt-1 font-mono text-sm text-ph-text-primary">{latest.phase}</div>
          </div>
          <div className="rounded-lg border border-ph-borderSubtle bg-ph-bg-base px-4 py-3">
            <div className="font-mono text-[10px] uppercase text-ph-text-muted">
              Scam confidence
            </div>
            <div className="mt-1 text-2xl font-light text-ph-danger">
              {latest.scamConfidence}%
            </div>
          </div>
        </div>
      ) : null}

      {transcript ? (
        <p className="mt-4 rounded-lg border border-ph-borderSubtle bg-ph-bg-base px-4 py-3 font-sans text-xs italic leading-relaxed text-ph-text-tertiary">
          &ldquo;{transcript}&rdquo;
        </p>
      ) : null}

      {latest?.decision ? (
        <p className="mt-3 font-mono text-[11px] uppercase text-ph-text-muted">
          Decision: {latest.decision}
        </p>
      ) : null}
    </section>
  );
}
