import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clientErrorFromApiFailure,
  getQueryErrorMessage,
  type PhantomNotification,
} from "@phantom/shared";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useEscapeKey } from "@/hooks/useEscapeKey.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

const LAYER_COLORS: Record<string, string> = {
  shield: "bg-ph-shield-bg text-ph-shield-text",
  brain: "bg-ph-brain-bg text-ph-brain-text",
  sword: "bg-ph-sword-bg text-ph-sword-text",
  autopilot: "bg-ph-autopilot-bg text-ph-autopilot-text",
};

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-ph-danger",
  high: "bg-ph-warning",
  medium: "bg-ph-accent-light",
  low: "bg-ph-text-muted",
};

function BellIcon({ unread }: { unread: number }) {
  return (
    <span className="relative">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-ph-text-secondary"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ph-danger px-1 font-mono text-[9px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </span>
  );
}

function NotificationRow({
  notif,
  onMarkRead,
  onNavigate,
}: {
  notif: PhantomNotification;
  onMarkRead: (id: string) => void;
  onNavigate: (link: string) => void;
}) {
  const layerCls = LAYER_COLORS[notif.layer] ?? LAYER_COLORS.shield;
  const dotCls = PRIORITY_DOT[notif.priority] ?? PRIORITY_DOT.medium;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={[
        "group flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors",
        notif.isRead
          ? "opacity-60 hover:bg-ph-raised/40"
          : "hover:bg-ph-raised/70",
      ].join(" ")}
      onClick={() => {
        if (!notif.isRead) onMarkRead(notif.id);
        if (notif.linkTo) onNavigate(notif.linkTo);
      }}
    >
      <span
        className={["mt-1.5 h-2 w-2 shrink-0 rounded-full", dotCls].join(" ")}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={[
              "rounded px-1.5 py-px font-mono text-[9px] font-semibold uppercase",
              layerCls,
            ].join(" ")}
          >
            {notif.layer}
          </span>
          <span className="ml-auto font-mono text-[10px] text-ph-text-muted">
            {formatRelativeTime(notif.createdAt)}
          </span>
        </div>
        <div className="mt-0.5 font-sans text-[12px] font-semibold text-ph-text-primary">
          {notif.title}
        </div>
        <div className="mt-0.5 line-clamp-2 font-sans text-[11px] leading-snug text-ph-text-tertiary">
          {notif.body}
        </div>
      </div>
    </motion.button>
  );
}

export function NotificationCenter() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const countQuery = useQuery({
    queryKey: queryKeys.notificationCount(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.notifications.count(accessToken, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    refetchInterval: 30_000,
    staleTime: STALE.notifications,
  });

  const prevUnreadRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (countQuery.isPending || accessToken === null) return;
    const u = countQuery.data?.unreadCount ?? 0;
    if (
      prevUnreadRef.current !== undefined &&
      u > prevUnreadRef.current &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      const delta = u - prevUnreadRef.current;
      try {
        new Notification("Phantom", {
          body:
            delta === 1
              ? "You have a new notification"
              : `${String(delta)} new notifications`,
          tag: "phantom-notification-delta",
        });
      } catch {
        /* ignore if Notifications API unavailable */
      }
    }
    prevUnreadRef.current = u;
  }, [accessToken, countQuery.isPending, countQuery.data?.unreadCount]);

  const listQuery = useQuery({
    queryKey: queryKeys.notifications(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.notifications.list(
        accessToken,
        {
          limit: 50,
        },
        { signal }
      );
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: open && accessToken !== null,
    staleTime: STALE.notifications,
  });

  useEffect(() => {
    if (!open || !accessToken) return;
    void phantomApi.notifications.seedDemo(accessToken);
  }, [open, accessToken]);

  useEffect(() => {
    if (!accessToken) setOpen(false);
  }, [accessToken]);

  const markRead = useMutation({
    mutationFn: (id: string) => {
      if (!accessToken) {
        return Promise.reject(new Error("signed_out"));
      }
      return phantomApi.notifications.markRead(accessToken, id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.notifications(accessToken),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.notificationCount(accessToken),
      });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!accessToken) {
        return Promise.reject(new Error("signed_out"));
      }
      const res = await phantomApi.notifications.markAllRead(accessToken);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.notifications(accessToken),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.notificationCount(accessToken),
      });
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEscapeKey(open, () => setOpen(false));

  const unread = countQuery.data?.unreadCount ?? 0;
  const items = listQuery.data?.items ?? [];

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md border border-[#2a2a34] bg-ph-raised p-2 transition-colors hover:border-ph-accent-border"
        aria-controls="phantom-notification-panel"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <BellIcon unread={unread} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="phantom-notification-panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-lg border border-ph-border bg-ph-surface shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-ph-border px-4 py-3">
              <span className="font-sans text-[13px] font-semibold text-ph-text-primary">
                Notifications
              </span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="cursor-pointer font-sans text-[11px] text-ph-accent-light hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {listQuery.isPending && open ? (
                <div className="py-10 text-center font-sans text-[12px] text-ph-text-tertiary">
                  Loading…
                </div>
              ) : null}
              {listQuery.isError ? (
                <div className="px-4 py-6 text-center font-sans text-[12px] text-ph-danger">
                  <p>{getQueryErrorMessage(listQuery.error)}</p>
                  <button
                    type="button"
                    onClick={() => void listQuery.refetch()}
                    className="mt-3 cursor-pointer rounded-md border border-ph-border bg-ph-surface px-3 py-1.5 font-sans text-[11px] text-ph-text-secondary hover:bg-ph-raised"
                  >
                    Retry
                  </button>
                </div>
              ) : null}
              {!listQuery.isPending && !listQuery.isError && items.length === 0 ? (
                <div className="py-10 text-center font-sans text-[12px] text-ph-text-muted">
                  No notifications yet
                </div>
              ) : null}
              {!listQuery.isPending && !listQuery.isError && items.length > 0 ? (
                <AnimatePresence initial={false}>
                  {items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notif={n}
                      onMarkRead={(id) => markRead.mutate(id)}
                      onNavigate={(link) => {
                        setOpen(false);
                        navigate(link);
                      }}
                    />
                  ))}
                </AnimatePresence>
              ) : null}
            </div>
            {(markRead.isError || markAllRead.isError) && (
              <div className="border-t border-ph-border px-4 py-2 font-sans text-[11px] text-ph-danger">
                {markRead.isError
                  ? getQueryErrorMessage(markRead.error)
                  : getQueryErrorMessage(markAllRead.error)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
