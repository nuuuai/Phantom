import { useQuery } from "@tanstack/react-query";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function EmailInboxPage() {
  const accessToken = useSessionStore((s) => s.accessToken);

  const inboxQuery = useQuery({
    queryKey: queryKeys.emailInbox(accessToken),
    queryFn: async () => {
      const res = await phantomApi.emailInbox.list(accessToken, 60);
      if (!res.ok) throw new Error(res.error.message);
      return res.data.items;
    },
    enabled: accessToken !== null,
  });

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
        is configured).
      </p>

      {inboxQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">Loading…</p>
      )}
      {inboxQuery.isError && (
        <p className="mt-8 font-sans text-sm text-ph-danger">
          {inboxQuery.error instanceof Error
            ? inboxQuery.error.message
            : "Could not load inbox."}
        </p>
      )}
      {inboxQuery.data && inboxQuery.data.length === 0 && (
        <p className="mt-8 rounded-xl border border-ph-border bg-ph-surface px-5 py-4 font-sans text-sm text-ph-text-tertiary">
          No messages yet. When MX + webhook delivery are live, new mail will
          appear here.
        </p>
      )}
      {inboxQuery.data && inboxQuery.data.length > 0 && (
        <ul className="mt-6 divide-y divide-ph-border rounded-xl border border-ph-border bg-ph-surface">
          {inboxQuery.data.map((m) => (
            <li key={m.id} className="px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-sans text-sm font-medium text-ph-text-primary">
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
                <p className="mt-2 line-clamp-3 font-sans text-sm text-ph-text-secondary">
                  {m.snippet}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
