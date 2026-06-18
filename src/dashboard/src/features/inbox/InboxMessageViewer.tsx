import type { AliasInboxItem } from "@phantom/shared";
import {
  classifyInboxMessage,
  clientErrorFromApiFailure,
  scoreInboxPhishing,
} from "@phantom/shared";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useEscapeKey } from "@/hooks/useEscapeKey.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";

interface InboxMessageViewerProps {
  accessToken: string;
  message: AliasInboxItem;
  onClose: () => void;
  onToggleRead: (id: string, isRead: boolean) => void;
  onAliasFlagged: () => void;
  markBusy: boolean;
}

function phishingBadgeClass(level: "low" | "moderate" | "high"): string {
  if (level === "high") return "text-ph-danger border-ph-danger/40 bg-ph-danger/10";
  if (level === "moderate") return "text-ph-warning border-ph-warning/40 bg-ph-warning/10";
  return "text-ph-success border-ph-success/40 bg-ph-success/10";
}

export function InboxMessageViewer({
  accessToken,
  message,
  onClose,
  onToggleRead,
  onAliasFlagged,
  markBusy,
}: InboxMessageViewerProps) {
  useEscapeKey(true, onClose);

  const phishing = scoreInboxPhishing({
    subject: message.subject,
    fromAddress: message.fromAddress,
    snippet: message.snippet,
  });

  const classification = classifyInboxMessage({
    messageId: message.id,
    subject: message.subject,
    fromAddress: message.fromAddress,
    snippet: message.snippet,
  });

  const flagMutation = useMutation({
    mutationFn: async () => {
      const res = await phantomApi.intelligence.flagInboxAlias(
        accessToken,
        message.id
      );
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    onSuccess: () => onAliasFlagged(),
  });

  const showFlag =
    classification.category === "phishing" ||
    classification.category === "spam" ||
    phishing.level !== "low";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inbox-message-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-ph-border bg-ph-surface shadow-none">
        <div className="flex items-start justify-between gap-3 border-b border-ph-border px-5 py-4">
          <div className="min-w-0">
            <h2
              id="inbox-message-title"
              className="font-sans text-base font-semibold text-ph-text-primary"
            >
              {message.subject || "(No subject)"}
            </h2>
            <p className="mt-1 font-mono text-[11px] text-ph-text-muted">
              {formatRelativeTime(message.receivedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ph-border px-2 py-1 font-sans text-xs text-ph-text-secondary hover:bg-ph-raised"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-2 font-sans text-sm">
            <div>
              <span className="text-ph-text-muted">From </span>
              <span className="font-mono text-ph-text-secondary">{message.fromAddress}</span>
            </div>
            <div>
              <span className="text-ph-text-muted">To </span>
              <span className="font-mono text-ph-text-secondary">{message.aliasAddress}</span>
            </div>
          </div>

          <div className="rounded-lg border border-ph-borderSubtle bg-ph-bg-base px-4 py-3">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted">
              AI classification · Brain
            </div>
            <p className="mt-1 font-sans text-sm capitalize text-ph-text-primary">
              {classification.category}
              <span className="ml-2 font-mono text-xs text-ph-text-tertiary">
                {Math.round(classification.confidence * 100)}% confidence
              </span>
            </p>
          </div>

          <div
            className={`rounded-lg border px-4 py-3 ${phishingBadgeClass(phishing.level)}`}
            role="status"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wide">
                Phishing risk · Brain
              </span>
              <span className="font-mono text-xs">{phishing.score}/100</span>
              <span className="font-sans text-xs capitalize">{phishing.level}</span>
            </div>
            {phishing.signals.length > 0 ? (
              <ul className="mt-1 space-y-0.5">
                {phishing.signals.map((s) => (
                  <li key={s} className="font-sans text-[11px] opacity-90">
                    · {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-sans text-[11px] opacity-90">
                No suspicious patterns detected in subject, sender, or snippet.
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-tertiary">
              Message
            </div>
            <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ph-text-secondary">
              {message.snippet || "No content available."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-ph-borderSubtle pt-4">
            <button
              type="button"
              disabled={markBusy}
              onClick={() => onToggleRead(message.id, !message.isRead)}
              className="rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs text-ph-text-primary hover:bg-ph-border/40 disabled:opacity-50"
            >
              Mark as {message.isRead ? "unread" : "read"}
            </button>
            {showFlag ? (
              <button
                type="button"
                disabled={flagMutation.isPending}
                onClick={() => flagMutation.mutate()}
                className="rounded-md border border-ph-warning/40 bg-ph-warning/10 px-3 py-1.5 font-sans text-xs text-ph-warning disabled:opacity-50"
              >
                {flagMutation.isPending ? "Flagging…" : "Flag alias (warning)"}
              </button>
            ) : null}
            <Link
              to={`/aliases/${message.aliasId}`}
              className="rounded-md border border-ph-accent-border bg-ph-accent-bg px-3 py-1.5 font-sans text-xs text-ph-accent-light"
            >
              Review alias
            </Link>
          </div>
          {flagMutation.isError ? (
            <p className="font-sans text-xs text-ph-danger">
              Could not flag alias — try again from the alias page.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
