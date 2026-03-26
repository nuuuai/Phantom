import type { NotificationPrefItem } from "@phantom/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
      </div>
    </div>
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
