import {
  clientErrorFromApiFailure,
  getQueryErrorMessage,
  scoreInboxPhishing,
  type AliasInboxItem,
} from "@phantom/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useState } from "react";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { InboxMessageViewer } from "./InboxMessageViewer.js";
import { InboxSummaryPanel } from "./InboxSummaryPanel.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";
import { aliasesAll, emailInboxAll, queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

const InboxMessageRow = memo(function InboxMessageRow({
  m,
  markBusy,
  onToggleRead,
  onOpen,
}: {
  m: AliasInboxItem;
  markBusy: boolean;
  onToggleRead: (id: string, isRead: boolean) => void;
  onOpen: (message: AliasInboxItem) => void;
}) {
  const phishing = scoreInboxPhishing({
    subject: m.subject,
    fromAddress: m.fromAddress,
    snippet: m.snippet,
  });

  return (
    <li className="px-5 py-4">
      <button
        type="button"
        onClick={() => onOpen(m)}
        className="w-full text-left"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="flex flex-wrap items-center gap-2 font-sans text-sm font-medium text-ph-text-primary">
            {!m.isRead && (
              <span
                className="rounded bg-ph-accent/15 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-ph-accent"
                aria-label="Unread"
              >
                New
              </span>
            )}
            {phishing.level !== "low" && (
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${
                  phishing.level === "high"
                    ? "border-ph-danger/40 text-ph-danger"
                    : "border-ph-warning/40 text-ph-warning"
                }`}
              >
                {phishing.level} risk
              </span>
            )}
            {m.subject}
          </span>
          <span className="font-mono text-[10px] text-ph-text-muted">
            {formatRelativeTime(m.receivedAt)}
          </span>
        </div>
        <div className="mt-1 font-mono text-[11px] text-ph-text-secondary">
          To {m.aliasAddress}
        </div>
        <div className="mt-1 font-sans text-xs text-ph-text-tertiary">
          From {m.fromAddress}
        </div>
        {m.snippet.length > 0 && (
          <p className="mt-2 line-clamp-2 font-sans text-sm text-ph-text-secondary">
            {m.snippet}
          </p>
        )}
      </button>
      <div className="mt-2 flex flex-wrap gap-2">
        {!m.isRead ? (
          <button
            type="button"
            disabled={markBusy}
            onClick={() => onToggleRead(m.id, true)}
            className="rounded border border-ph-border bg-ph-raised px-2 py-0.5 font-sans text-[11px] text-ph-text-secondary hover:bg-ph-surface disabled:opacity-50"
          >
            Mark read
          </button>
        ) : (
          <button
            type="button"
            disabled={markBusy}
            onClick={() => onToggleRead(m.id, false)}
            className="rounded border border-transparent px-2 py-0.5 font-sans text-[11px] text-ph-text-muted hover:border-ph-border hover:text-ph-text-secondary disabled:opacity-50"
          >
            Mark unread
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpen(m)}
          className="rounded border border-ph-accent-border bg-ph-accent/[0.08] px-2 py-0.5 font-sans text-[11px] text-ph-accent-light hover:bg-ph-accent/[0.15]"
        >
          View message
        </button>
      </div>
    </li>
  );
});

export function EmailInboxPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<AliasInboxItem | null>(
    null
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchDraft.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  const summaryQuery = useQuery({
    queryKey: queryKeys.inboxSummary(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.intelligence.inboxSummary(accessToken!, {
        signal,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.inboxSummary,
  });

  const inboxQuery = useQuery({
    queryKey: queryKeys.emailInbox(accessToken, debouncedQ, unreadOnly),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.emailInbox.list(
        accessToken,
        {
          limit: 60,
          q: debouncedQ || undefined,
          unread: unreadOnly || undefined,
        },
        { signal }
      );
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.items;
    },
    enabled: accessToken !== null,
    staleTime: STALE.emailInbox,
  });

  const markReadMutation = useMutation({
    mutationFn: async (args: { id: string; isRead: boolean }) => {
      if (!accessToken) throw new Error("Not signed in");
      const res = await phantomApi.emailInbox.patchRead(
        accessToken,
        args.id,
        args.isRead
      );
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.item;
    },
    onSuccess: (item) => {
      void queryClient.invalidateQueries({
        queryKey: emailInboxAll,
      });
      setSelectedMessage((prev) =>
        prev?.id === item.id ? { ...prev, isRead: item.isRead } : prev
      );
    },
  });

  const onToggleRead = useCallback(
    (id: string, isRead: boolean) => {
      markReadMutation.mutate({ id, isRead });
    },
    [markReadMutation]
  );

  if (!accessToken) {
    return <SessionGateMessage />;
  }

  return (
    <div className="px-8 py-6">
      <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
        Alias inbox
      </h1>
      <p className="mt-1 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        Messages received at your{" "}
        <span className="font-mono text-ph-text-secondary">@phantom.id</span>{" "}
        aliases (ingested via the signed inbound webhook when your mail worker
        is configured). Contract: repo{" "}
        <span className="font-mono text-[11px] text-ph-text-muted">
          docs/roadmap/EMAIL_INBOUND.md
        </span>
        .
      </p>

      {summaryQuery.data ? (
        <InboxSummaryPanel summary={summaryQuery.data} />
      ) : null}

      <div className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
        <div className="max-w-md flex-1">
          <label htmlFor="inbox-search" className="sr-only">
            Filter inbox
          </label>
          <input
            id="inbox-search"
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Filter by subject, sender, or snippet…"
            className="w-full rounded-md border border-ph-border bg-ph-raised px-3 py-2 font-sans text-sm text-ph-text-primary outline-none ring-ph-accent/30 placeholder:text-ph-text-muted focus:ring-2"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-ph-text-secondary">
          <input
            type="checkbox"
            className="rounded border-ph-border"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
      </div>

      {inboxQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">Loading…</p>
      )}
      {inboxQuery.isError && (
        <div className="mt-8 rounded-lg border border-ph-danger/40 bg-ph-danger/5 px-4 py-3">
          <p className="font-sans text-sm text-ph-danger">
            {getQueryErrorMessage(inboxQuery.error)}
          </p>
          <button
            type="button"
            className="mt-3 rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs text-ph-text-primary hover:bg-ph-border/40"
            onClick={() => void inboxQuery.refetch()}
          >
            Retry
          </button>
        </div>
      )}
      {markReadMutation.isError && (
        <p
          className="mt-4 rounded-lg border border-ph-danger/40 bg-ph-danger/5 px-4 py-2 font-sans text-xs text-ph-danger"
          role="alert"
        >
          {getQueryErrorMessage(markReadMutation.error)}
        </p>
      )}
      {inboxQuery.data && inboxQuery.data.length === 0 && (
        <p className="mt-8 rounded-xl border border-ph-border bg-ph-surface px-5 py-4 font-sans text-sm text-ph-text-tertiary">
          {debouncedQ.length > 0
            ? "No messages match this filter. Try different keywords or clear the search."
            : "No messages yet. When MX + webhook delivery are live, new mail will appear here."}
        </p>
      )}
      {inboxQuery.data && inboxQuery.data.length > 0 && (
        <ul className="mt-6 divide-y divide-ph-border rounded-xl border border-ph-border bg-ph-surface">
          {inboxQuery.data.map((m) => (
            <InboxMessageRow
              key={m.id}
              m={m}
              markBusy={markReadMutation.isPending}
              onToggleRead={onToggleRead}
              onOpen={setSelectedMessage}
            />
          ))}
        </ul>
      )}
      {selectedMessage && accessToken ? (
        <InboxMessageViewer
          accessToken={accessToken}
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onToggleRead={onToggleRead}
          onAliasFlagged={() => {
            void queryClient.invalidateQueries({ queryKey: aliasesAll });
            void queryClient.invalidateQueries({ queryKey: emailInboxAll });
          }}
          markBusy={markReadMutation.isPending}
        />
      ) : null}
    </div>
  );
}
