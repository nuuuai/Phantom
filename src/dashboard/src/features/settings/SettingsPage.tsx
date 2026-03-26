import {
  clientErrorFromApiFailure,
  getQueryErrorMessage,
  type NotificationPrefItem,
  type UserAccountSnapshot,
} from "@phantom/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal.js";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { DASHBOARD_PATHS } from "@/lib/dashboardRoutes.js";
import {
  notificationPrefsAll,
  queryKeys,
} from "@/lib/queryKeys.js";
import {
  isValidForwardEmailInput,
} from "@/lib/settingsForwardEmail.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { setSkipDevBootstrap } from "@/lib/devBootstrap.js";
import { queryClient } from "@/lib/queryClient.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function SettingsPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const planLabel = useSessionStore((s) => s.planLabel);
  const clearSession = useSessionStore((s) => s.clearSession);
  const setUser = useSessionStore((s) => s.setUser);
  const navigate = useNavigate();

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const meQuery = useQuery({
    queryKey: queryKeys.userMe(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.user.me(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.userMe,
  });

  const prefsQuery = useQuery({
    queryKey: queryKeys.notificationPrefs(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.notifications.getPreferences(accessToken!, {
        signal,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.items;
    },
    enabled: accessToken !== null,
    staleTime: STALE.notificationPrefs,
  });

  const onLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const rt = useSessionStore.getState().refreshToken;
    if (rt) {
      try {
        await phantomApi.auth.logout(rt);
      } catch {
        /* still clear local session */
      }
    }
    setSkipDevBootstrap();
    queryClient.clear();
    clearSession();
    setSigningOut(false);
    void navigate("/", { replace: true });
  };

  if (!accessToken) {
    return <SessionGateMessage />;
  }

  if (meQuery.isPending && !meQuery.data) {
    return (
      <div className="min-w-0 max-w-full overflow-x-hidden px-4 py-6 font-sans text-sm text-ph-text-tertiary sm:px-8">
        Loading account…
      </div>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <div className="min-w-0 max-w-full overflow-x-hidden px-4 py-6 sm:px-8">
        <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
          Settings
        </h1>
        <p className="mt-3 font-sans text-sm text-ph-danger">
          {meQuery.isError
            ? getQueryErrorMessage(meQuery.error)
            : "Could not load account settings."}
        </p>
        <button
          type="button"
          className="mt-4 rounded-md border border-ph-border bg-ph-raised px-4 py-2 font-sans text-xs text-ph-text-primary hover:bg-ph-border/40"
          onClick={() => void meQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const { user, aliasUsage } = meQuery.data;
  const tierIsFree = user.tier === "free";

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden px-4 py-6 sm:px-8">
      <UpgradeModal
        open={upgradeOpen}
        reason="generic"
        onDismiss={() => setUpgradeOpen(false)}
        titleId="settings-upgrade-title"
      />

      <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
        Settings
      </h1>
      <p className="mt-1 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        Account, forwarding, quotas, notifications, and session. Limits and
        usage come from{" "}
        <span className="font-mono text-[11px] text-ph-text-muted">
          GET /api/user/me
        </span>
        .
      </p>

      <div className="mt-8 max-w-xl space-y-6">
        <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
            Account
          </div>
          <dl className="mt-3 space-y-2 font-sans text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ph-text-tertiary">Email</dt>
              <dd className="text-right text-ph-text-primary">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ph-text-tertiary">Display name</dt>
              <dd className="text-right text-ph-text-secondary">
                {user.displayName?.trim() ? user.displayName : "—"}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <dt className="text-ph-text-tertiary">Plan</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-ph-border bg-ph-bg px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-ph-accent-light">
                  {planLabel}
                </span>
                <span className="font-mono text-[11px] text-ph-text-secondary">
                  {user.tier}
                  {user.subscriptionStatus && user.subscriptionStatus !== "none"
                    ? ` · ${user.subscriptionStatus}`
                    : ""}
                </span>
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={DASHBOARD_PATHS.billing}
              className="inline-flex rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs text-ph-text-primary transition-colors hover:bg-ph-border/40"
            >
              Billing & subscription
            </Link>
            {tierIsFree ? (
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="inline-flex rounded-md border border-ph-accent-border bg-[#6C3AED15] px-3 py-1.5 font-sans text-xs font-medium text-ph-accent-light"
              >
                Upgrade to Pro
              </button>
            ) : null}
          </div>
        </section>

        <ForwardingSection
          accessToken={accessToken}
          forwardToEmail={user.forwardToEmail ?? null}
          onAccountSaved={(snapshot) => {
            setUser({
              email: snapshot.user.email,
              displayName: snapshot.user.displayName,
              tier: snapshot.user.tier,
            });
          }}
        />

        <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
            Alias & vault quotas
          </div>
          <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
            Usage per alias type from your account. Free tier caps are enforced
            on generate; Pro is unlimited for these types.
          </p>
          <ul className="mt-4 space-y-3">
            {aliasUsage.map((u) => {
              const cap = u.max === null ? "∞" : String(u.max);
              const pct =
                u.max === null || u.max === 0
                  ? 0
                  : Math.min(100, (u.used / u.max) * 100);
              const manageHref =
                u.type === "password" ? DASHBOARD_PATHS.vault : DASHBOARD_PATHS.aliases;
              const manageLabel =
                u.type === "password" ? "Open vault" : "Open aliases";
              return (
                <li key={u.type}>
                  <div className="flex justify-between gap-2 font-mono text-[11px] text-ph-text-secondary">
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
                  <Link
                    to={manageHref}
                    className="mt-1 inline-block font-sans text-[11px] text-ph-accent-light underline-offset-2 hover:underline"
                  >
                    {manageLabel}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <NotificationPrefsSection
          accessToken={accessToken}
          prefsQuery={prefsQuery}
        />

        <DesktopNotificationsSection />

        <section className="rounded-xl border border-ph-danger/30 bg-ph-danger/5 p-5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-danger">
            Session
          </div>
          <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
            Sign out clears tokens and cached data on this device. Account
            deletion is not available in the API for Phase 1.
          </p>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void onLogout()}
            className="mt-4 rounded-md border border-ph-border bg-ph-raised px-4 py-2 font-sans text-xs font-medium text-ph-text-primary transition-colors hover:bg-ph-border/40 disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </section>
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

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    const sync = () => setPerm(Notification.permission);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  if (perm === "unsupported") {
    return null;
  }

  const copy =
    perm === "granted"
      ? "Browser notifications are allowed for this site. Phantom only shows a desktop alert when your unread count increases (not on every background poll)."
      : perm === "denied"
        ? "Notifications are blocked for this site. To enable them, use your browser’s site settings for this dashboard URL and allow notifications, then reload."
        : "Choose whether Phantom may show desktop alerts when new unread notifications arrive. This does not send email — outbound SMTP is not wired in Phase 1 (see EMAIL_INBOUND.md).";

  return (
    <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
        Desktop notifications
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">{copy}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] text-ph-text-secondary">
          Permission:{" "}
          <span className="text-ph-text-primary">{perm}</span>
        </span>
        {perm === "default" ? (
          <button
            type="button"
            onClick={() => {
              void Notification.requestPermission().then((p) => {
                setPerm(p);
              });
            }}
            className="rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs text-ph-text-primary transition-colors hover:bg-ph-border/60"
          >
            Request permission
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ForwardingSection({
  accessToken,
  forwardToEmail,
  onAccountSaved,
}: {
  accessToken: string;
  forwardToEmail: string | null;
  onAccountSaved: (snapshot: UserAccountSnapshot) => void;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(forwardToEmail ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setDraft(forwardToEmail ?? "");
  }, [forwardToEmail]);

  const saveMutation = useMutation({
    mutationFn: async (next: string | null) => {
      const res = await phantomApi.user.patchMe(accessToken, {
        forwardToEmail: next,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    onSuccess: (data) => {
      setFieldError(null);
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 4000);
      onAccountSaved(data);
      void qc.invalidateQueries({ queryKey: queryKeys.userMe(accessToken) });
    },
  });

  return (
    <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
        Forward-to email (optional)
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        Stored on your account for future product use (e.g. if we add outbound
        digests). It is{" "}
        <span className="font-medium text-ph-text-secondary">not</span> used to
        relay inbound alias mail — inbound uses the signed webhook in{" "}
        <span className="font-mono text-[10px]">EMAIL_INBOUND.md</span>. Phase 1
        has no API SMTP sender; see{" "}
        <span className="font-mono text-[10px]">NOTIFICATIONS_EMAIL_ENABLED</span>{" "}
        in DEPLOYMENT.md.
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
            onChange={(e) => {
              setDraft(e.target.value);
              setFieldError(null);
              setSaveSuccess(false);
            }}
            placeholder="you@example.com"
            aria-invalid={fieldError != null}
            className="rounded-md border border-ph-border bg-ph-raised px-3 py-2 font-sans text-sm text-ph-text-primary outline-none ring-ph-accent/30 placeholder:text-ph-text-muted focus:ring-2 aria-invalid:border-ph-danger"
          />
        </label>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => {
              const t = draft.trim();
              if (!isValidForwardEmailInput(t)) {
                setFieldError(
                  "Enter a valid email, or clear the field and save to remove."
                );
                return;
              }
              setFieldError(null);
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
              setFieldError(null);
              setSaveSuccess(false);
              saveMutation.mutate(null);
            }}
            className="rounded-md border border-ph-border px-4 py-2 font-sans text-xs text-ph-text-secondary transition-colors hover:bg-ph-raised/80"
          >
            Clear
          </button>
        </div>
      </div>
      {fieldError ? (
        <p className="mt-2 font-sans text-xs text-ph-danger" role="alert">
          {fieldError}
        </p>
      ) : null}
      {saveMutation.isError && (
        <p className="mt-2 font-sans text-xs text-ph-danger" role="alert">
          {getQueryErrorMessage(saveMutation.error)}
        </p>
      )}
      {saveSuccess && !saveMutation.isError ? (
        <p className="mt-2 font-sans text-xs text-ph-success" role="status">
          Saved.
        </p>
      ) : null}
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
  prefsQuery,
}: {
  accessToken: string;
  prefsQuery: UseQueryResult<NotificationPrefItem[], Error>;
}) {
  const qc = useQueryClient();
  const [savedFlash, setSavedFlash] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (items: NotificationPrefItem[]) => {
      const res = await phantomApi.notifications.updatePreferences(
        accessToken,
        items
      );
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.items;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.notificationPrefs(accessToken),
      });
      void qc.invalidateQueries({ queryKey: notificationPrefsAll });
      void qc.invalidateQueries({
        queryKey: queryKeys.notifications(accessToken),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.notificationCount(accessToken),
      });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 3500);
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
        Control which categories appear in the bell feed and count toward the
        unread badge. Disabled categories are hidden from the list and count (
        <span className="font-mono text-[10px]">GET /api/notifications</span>).
      </p>

      {prefsQuery.isPending && (
        <p className="mt-4 font-sans text-xs text-ph-text-tertiary">
          Loading preferences…
        </p>
      )}

      {prefsQuery.isError && (
        <div className="mt-4">
          <p className="font-sans text-xs text-ph-danger">
            {getQueryErrorMessage(prefsQuery.error)}
          </p>
          <button
            type="button"
            className="mt-2 rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs text-ph-text-primary hover:bg-ph-border/40"
            onClick={() => void prefsQuery.refetch()}
          >
            Retry
          </button>
        </div>
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
                aria-pressed={pref.enabled}
                aria-busy={updateMutation.isPending}
                onClick={() => toggle(pref.category, pref.enabled)}
                disabled={updateMutation.isPending}
                className={[
                  "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50",
                  pref.enabled ? "bg-ph-accent" : "bg-ph-border",
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

      {updateMutation.isError && (
        <p className="mt-4 font-sans text-xs text-ph-danger" role="alert">
          {getQueryErrorMessage(updateMutation.error)}
        </p>
      )}
      {savedFlash ? (
        <p className="mt-2 font-sans text-xs text-ph-success" role="status">
          Preferences updated.
        </p>
      ) : null}
    </section>
  );
}
