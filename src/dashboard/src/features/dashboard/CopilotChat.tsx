import type { CopilotPendingAction, CopilotPrompt } from "@phantom/shared";
import { buildCopilotPrompts, clientErrorFromApiFailure } from "@phantom/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { phantomApi } from "@/lib/api/phantomApi.js";
import {
  aliasDetailAll,
  aliasesAll,
  brokerScanResultsAll,
  brokerScanSummaryAll,
  dashboardOverviewAll,
  queryKeys,
} from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

interface CopilotChatProps {
  /** Override default prompt chips (e.g. from overview). */
  prompts?: readonly CopilotPrompt[];
  compact?: boolean;
}

export function CopilotChat({ prompts, compact = false }: CopilotChatProps) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<CopilotPendingAction | null>(
    null
  );
  const [modeLabel, setModeLabel] = useState<string>("rules");
  const [busy, setBusy] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: queryKeys.copilotStatus(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.copilot.status(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.copilotStatus,
  });

  const chips = prompts ?? buildCopilotPrompts();

  const invalidateAfterAction = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: dashboardOverviewAll });
    void queryClient.invalidateQueries({ queryKey: aliasesAll });
    void queryClient.invalidateQueries({ queryKey: aliasDetailAll });
    void queryClient.invalidateQueries({ queryKey: brokerScanSummaryAll });
    void queryClient.invalidateQueries({ queryKey: brokerScanResultsAll });
  }, [queryClient]);

  const ask = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || !accessToken) return;
      setBusy(true);
      setError(null);
      setPendingAction(null);
      setInput(trimmed);
      try {
        const res = await phantomApi.copilot.chat(accessToken, trimmed);
        if (!res.ok) {
          setError(clientErrorFromApiFailure(res).message);
          return;
        }
        setResponse(res.data.reply);
        setPendingAction(res.data.pendingAction ?? null);
        setModeLabel(
          res.data.mode === "llm"
            ? `Brain · ${res.data.model ?? "LLM"}`
            : "Brain · rules"
        );
      } catch {
        setError("Could not reach Copilot. Check that the API is running.");
      } finally {
        setBusy(false);
      }
    },
    [accessToken]
  );

  const confirmAction = useCallback(async () => {
    if (!accessToken || !pendingAction) return;
    setConfirmBusy(true);
    setError(null);
    try {
      const res = await phantomApi.copilot.confirm(accessToken, {
        toolId: pendingAction.toolId,
        params: pendingAction.params,
      });
      if (!res.ok) {
        setError(clientErrorFromApiFailure(res).message);
        return;
      }
      setPendingAction(null);
      setResponse((prev) =>
        prev ? `${prev}\n\n✓ ${res.data.message}` : res.data.message
      );
      invalidateAfterAction();
    } catch {
      setError("Could not execute action. Try again from the relevant page.");
    } finally {
      setConfirmBusy(false);
    }
  }, [accessToken, pendingAction, invalidateAfterAction]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  const llmLive = statusQuery.data?.enabled ?? false;

  return (
    <div className={compact ? "" : "rounded-xl border border-ph-border bg-ph-surface p-5"}>
      {!compact && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-[#A78BFA] shadow-[0_0_6px_rgba(167,139,250,0.5)]"
              aria-hidden
            />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-ph-accent-light">
              Phantom Copilot
            </h2>
            <span className="font-mono text-[10px] text-ph-text-muted">
              {llmLive ? "LLM live" : "rules fallback"}
            </span>
          </div>
          <p className="mb-3 font-sans text-xs text-ph-text-tertiary">
            Ask about risk, rotations, brokers, or next steps. Confirmed actions
            run against your account — never raw PII in chat.
          </p>
        </>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => void ask(chip.prompt)}
            disabled={busy}
            className="rounded-md border border-ph-border bg-ph-raised px-2.5 py-1 font-sans text-[11px] text-ph-text-secondary transition-colors hover:border-ph-accent-border hover:text-ph-accent-light disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor={compact ? "copilot-drawer-input" : "copilot-input"} className="sr-only">
          Ask Phantom
        </label>
        <input
          id={compact ? "copilot-drawer-input" : "copilot-input"}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Phantom anything about your account…"
          disabled={busy}
          className="min-w-0 flex-1 rounded-md border border-ph-border bg-ph-raised px-3 py-2 font-sans text-sm text-ph-text-primary outline-none placeholder:text-ph-text-muted focus:ring-2 focus:ring-ph-accent/30"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-busy={busy}
          className="rounded-md border border-ph-accent-border bg-ph-accent/[0.12] px-4 py-2 font-sans text-xs font-medium text-ph-accent-light hover:bg-ph-accent/[0.2] disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      {error ? (
        <p className="mt-3 font-sans text-xs text-ph-danger" role="alert">
          {error}
        </p>
      ) : null}

      {pendingAction ? (
        <div
          className="mt-4 rounded-lg border border-ph-accent-border bg-ph-accent/[0.08] px-4 py-3"
          role="region"
          aria-label="Pending Copilot action"
        >
          <p className="font-mono text-[10px] uppercase tracking-wide text-ph-accent-light">
            Confirm action · Autopilot
          </p>
          <p className="mt-1 font-sans text-sm font-medium text-ph-text-primary">
            {pendingAction.title}
          </p>
          <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
            {pendingAction.description}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void confirmAction()}
              disabled={confirmBusy}
              aria-busy={confirmBusy}
              className="rounded-md border border-ph-accent-border bg-ph-accent/[0.15] px-3 py-1.5 font-sans text-xs font-medium text-ph-accent-light hover:bg-ph-accent/[0.25] disabled:opacity-50"
            >
              {confirmBusy ? "Running…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setPendingAction(null)}
              disabled={confirmBusy}
              className="rounded-md border border-ph-border px-3 py-1.5 font-sans text-xs text-ph-text-secondary hover:bg-ph-raised disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {response ? (
        <div
          className="mt-4 rounded-lg border border-ph-borderSubtle bg-ph-raised/50 px-4 py-3"
          role="status"
        >
          <p className="mb-2 font-mono text-[10px] uppercase text-ph-text-muted">
            {modeLabel}
          </p>
          <p className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ph-text-secondary">
            {response}
          </p>
        </div>
      ) : null}
    </div>
  );
}
