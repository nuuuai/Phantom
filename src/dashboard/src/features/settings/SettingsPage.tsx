import type { NotificationPrefItem } from "@phantom/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function SettingsPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const email = useSessionStore((s) => s.email);
  const planLabel = useSessionStore((s) => s.planLabel);

  const meQuery = useQuery({
    queryKey: queryKeys.userMe(accessToken),
    queryFn: async () => {
      const res = await phantomApi.user.me(accessToken);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    enabled: accessToken !== null,
  });

  if (!accessToken) {
    return <SessionGateMessage />;
  }

  if (meQuery.isPending) {
    return (
      <div className="px-8 py-6 font-sans text-sm text-ph-text-tertiary">
        Loading account…
      </div>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <div className="px-8 py-6 font-sans text-sm text-ph-danger">
        Could not load account settings.
      </div>
    );
  }

  const { user, aliasUsage } = meQuery.data;

  return (
    <div className="px-8 py-6">
      <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
        Settings
      </h1>
      <p className="mt-1 font-sans text-sm text-ph-text-tertiary">
        Account, plan, and alias quotas (Free tier limits apply until
        upgrade).
      </p>

      <div className="mt-8 max-w-xl space-y-6">
        <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
            Account
          </div>
          <dl className="mt-3 space-y-2 font-sans text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ph-text-tertiary">Email</dt>
              <dd className="text-ph-text-primary">{email || user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ph-text-tertiary">Plan</dt>
              <dd className="font-mono text-ph-accent-light">{planLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ph-text-tertiary">Tier</dt>
              <dd className="font-mono text-ph-text-secondary">{user.tier}</dd>
            </div>
          </dl>
        </section>

        <ForwardingSection
          accessToken={accessToken}
          forwardToEmail={user.forwardToEmail ?? null}
        />

        <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
            Alias quotas
          </div>
          <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
            Active aliases per type. Free tier caps are enforced on generate;
            Pro is unlimited.
          </p>
          <ul className="mt-4 space-y-3">
            {aliasUsage.map((u) => {
              const cap =
                u.max === null ? "∞" : String(u.max);
              const pct =
                u.max === null || u.max === 0
                  ? 0
                  : Math.min(100, (u.used / u.max) * 100);
              return (
                <li key={u.type}>
                  <div className="flex justify-between font-mono text-[11px] text-ph-text-secondary">
                    <span className="uppercase tracking-wide">{u.type}</span>
                    <span>
                      {u.used}/{cap}
                    </span>
                  </div>
                  {u.max !== null ? (
                    <div className="mt-1 h-1 rounded-sm bg-ph-border">
                      <div
                        className="h-full rounded-sm bg-ph-accent transition-[width] duration-500 ease-out"
                        style={{ width: `${String(pct)}%` }}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <NotificationPrefsSection accessToken={accessToken} />

        <DesktopNotificationsSection />
      </div>
    </div>
  );
}

function DesktopNotificationsSection() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(
    () =>
      typeof Notification !== "undefined"
        ? Notification.permission
        : "unsupported"
  );

  if (perm === "unsupported") {
    return null;
  }

  return (
    <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
        Desktop notifications
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        Browser notifications when Phantom surfaces high-priority alerts (permission
        is per-site). Server-side email for alerts is not wired in Phase 1; see{" "}
        <span className="font-mono text-[10px] text-ph-text-muted">
          docs/roadmap/EMAIL_INBOUND.md
        </span>
        .
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] text-ph-text-secondary">
          Status: {perm}
        </span>
        {perm === "default" && (
          <button
            type="button"
            onClick={() => {
              void Notification.requestPermission().then((p) => {
                setPerm(p);
              });
            }}
            className="rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs text-ph-text-primary transition-colors hover:bg-ph-border/60"
          >
            Enable
          </button>
        )}
      </div>
    </section>
  );
}

function ForwardingSection({
  accessToken,
  forwardToEmail,
}: {
  accessToken: string;
  forwardToEmail: string | null;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(forwardToEmail ?? "");

  useEffect(() => {
    setDraft(forwardToEmail ?? "");
  }, [forwardToEmail]);

  const saveMutation = useMutation({
    mutationFn: async (next: string | null) => {
      const res = await phantomApi.user.patchMe(accessToken, {
        forwardToEmail: next,
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.userMe(accessToken) });
    },
  });

  return (
    <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
        Email forwarding (optional)
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        Real address for forward / digest notifications when SMTP is wired.
        Stored on your account; not verified in Phase 1.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="font-sans text-[11px] text-ph-text-muted">
            Forward-to email
          </span>
          <input
            type="email"
            autoComplete="email"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-ph-border bg-ph-raised px-3 py-2 font-sans text-sm text-ph-text-primary outline-none ring-ph-accent/30 placeholder:text-ph-text-muted focus:ring-2"
          />
        </label>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => {
              const t = draft.trim();
              saveMutation.mutate(t.length === 0 ? null : t);
            }}
            className="rounded-md bg-ph-accent px-4 py-2 font-sans text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => {
              setDraft("");
              saveMutation.mutate(null);
            }}
            className="rounded-md border border-ph-border px-4 py-2 font-sans text-xs text-ph-text-secondary transition-colors hover:bg-ph-raised/80"
          >
            Clear
          </button>
        </div>
      </div>
      {saveMutation.isError && (
        <p className="mt-2 font-sans text-xs text-ph-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Save failed"}
        </p>
      )}
    </section>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  alias_health: "Alias health alerts",
  broker_removal: "Broker removal updates",
  security_alert: "Security alerts",
  system: "System messages",
};

function NotificationPrefsSection({
  accessToken,
}: {
  accessToken: string;
}) {
  const qc = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: queryKeys.notificationPrefs(accessToken),
    queryFn: async () => {
      const res = await phantomApi.notifications.getPreferences(accessToken);
      if (!res.ok) throw new Error(res.error.message);
      return res.data.items;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (items: NotificationPrefItem[]) => {
      const res = await phantomApi.notifications.updatePreferences(
        accessToken,
        items
      );
      if (!res.ok) throw new Error(res.error.message);
      return res.data.items;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.notificationPrefs(accessToken), data);
      void qc.invalidateQueries({
        queryKey: queryKeys.notifications(accessToken),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.notificationCount(accessToken),
      });
    },
  });

  const toggle = (category: string, current: boolean) => {
    const items = (prefsQuery.data ?? []).map((p) =>
      p.category === category ? { ...p, enabled: !current } : p
    );
    updateMutation.mutate(items);
  };

  return (
    <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
        Notification preferences
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        Control which notification categories appear in your feed and count
        toward the unread badge.
      </p>

      {prefsQuery.isPending && (
        <p className="mt-4 font-sans text-xs text-ph-text-tertiary">
          Loading…
        </p>
      )}

      {prefsQuery.data && (
        <ul className="mt-4 space-y-3">
          {prefsQuery.data.map((pref) => (
            <li
              key={pref.category}
              className="flex items-center justify-between gap-4"
            >
              <span className="font-sans text-sm text-ph-text-secondary">
                {CATEGORY_LABELS[pref.category] ?? pref.category}
              </span>
              <button
                type="button"
                onClick={() => toggle(pref.category, pref.enabled)}
                disabled={updateMutation.isPending}
                className={[
                  "relative h-5 w-9 cursor-pointer rounded-full transition-colors",
                  pref.enabled
                    ? "bg-ph-accent"
                    : "bg-ph-border",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    pref.enabled ? "left-[18px]" : "left-0.5",
                  ].join(" ")}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
