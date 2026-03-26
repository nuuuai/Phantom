import {
  clientErrorFromApiFailure,
  getQueryErrorMessage,
} from "@phantom/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function BillingPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const checkoutSessionId = searchParams.get("session_id");
  const canceledCheckout = searchParams.get("canceled");
  const [syncCheckoutError, setSyncCheckoutError] = useState<string | null>(
    null
  );
  const [checkoutSyncSuccess, setCheckoutSyncSuccess] = useState(false);

  const billingQuery = useQuery({
    queryKey: queryKeys.billingStatus(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.billing.status(accessToken, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.billingStatus,
  });

  const meQuery = useQuery({
    queryKey: queryKeys.userMe(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.user.me(accessToken, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.userMe,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await phantomApi.billing.checkoutSession(accessToken!);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.url;
    },
    onSuccess: (url) => {
      if (url) window.location.href = url;
    },
  });

  useEffect(() => {
    if (canceledCheckout === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("canceled");
      setSearchParams(next, { replace: true });
    }
  }, [canceledCheckout, searchParams, setSearchParams]);

  useEffect(() => {
    if (!accessToken || !checkoutSessionId) return;
    let cancelled = false;
    void (async () => {
      setSyncCheckoutError(null);
      setCheckoutSyncSuccess(false);
      const res = await phantomApi.billing.syncCheckoutSession(
        accessToken,
        checkoutSessionId
      );
      if (cancelled) return;
      if (!res.ok) {
        setSyncCheckoutError(clientErrorFromApiFailure(res).message);
        return;
      }
      setCheckoutSyncSuccess(true);
      const next = new URLSearchParams(searchParams);
      next.delete("session_id");
      setSearchParams(next, { replace: true });
      await qc.invalidateQueries({
        queryKey: queryKeys.userMe(accessToken),
      });
      await qc.invalidateQueries({
        queryKey: queryKeys.billingStatus(accessToken),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    checkoutSessionId,
    qc,
    searchParams,
    setSearchParams,
  ]);

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await phantomApi.billing.portalSession(accessToken!);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.url;
    },
    onSuccess: (url) => {
      if (url) window.location.href = url;
    },
  });

  if (!accessToken) {
    return <SessionGateMessage />;
  }

  const billing = billingQuery.data;
  const tier = meQuery.data?.user.tier;
  const canUpgrade = tier === "free";

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden px-4 py-6 sm:px-8">
      <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
        Billing
      </h1>
      <p className="mt-1 max-w-xl font-sans text-sm text-ph-text-tertiary">
        Phantom Pro unlocks unlimited aliases and data broker removal. Stripe
        Checkout and Customer Portal activate when API keys are configured.
      </p>

      {checkoutSyncSuccess && !syncCheckoutError ? (
        <div
          className="mt-6 max-w-xl rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 font-sans text-sm text-emerald-200"
          role="status"
        >
          Checkout session applied. Your tier should update shortly; use{" "}
          <span className="font-medium">Refresh account</span> if needed.
          <button
            type="button"
            className="ml-2 font-sans text-xs underline"
            onClick={() => setCheckoutSyncSuccess(false)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {syncCheckoutError && checkoutSessionId ? (
        <div
          className="mt-6 max-w-xl rounded-lg border border-ph-danger/40 bg-ph-danger/5 px-4 py-3 font-sans text-sm text-ph-danger"
          role="alert"
        >
          Could not apply checkout session: {syncCheckoutError}
        </div>
      ) : null}

      {billingQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">Loading…</p>
      )}
      {billingQuery.isError && (
        <div
          className="mt-8 max-w-xl rounded-lg border border-ph-danger/40 bg-ph-danger/5 px-4 py-3 font-sans text-sm text-ph-danger"
          role="alert"
        >
          <p>{getQueryErrorMessage(billingQuery.error)}</p>
          <button
            type="button"
            className="mt-3 rounded-md border border-ph-border bg-ph-surface px-3 py-1.5 font-sans text-xs text-ph-text-secondary hover:bg-ph-raised"
            onClick={() => void billingQuery.refetch()}
          >
            Retry
          </button>
        </div>
      )}
      {meQuery.isError && (
        <div
          className="mt-8 max-w-xl rounded-lg border border-ph-danger/40 bg-ph-danger/5 px-4 py-3 font-sans text-sm text-ph-danger"
          role="alert"
        >
          <p>{getQueryErrorMessage(meQuery.error)}</p>
          <button
            type="button"
            className="mt-3 rounded-md border border-ph-border bg-ph-surface px-3 py-1.5 font-sans text-xs text-ph-text-secondary hover:bg-ph-raised"
            onClick={() => void meQuery.refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {billing && (
        <div className="mt-8 max-w-xl space-y-6">
          <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
              Plan
            </div>
            <dl className="mt-3 space-y-2 font-sans text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ph-text-tertiary">Tier</dt>
                <dd className="font-mono text-ph-text-primary">{tier}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ph-text-tertiary">Subscription</dt>
                <dd className="font-mono text-ph-text-secondary">
                  {meQuery.data?.user.subscriptionStatus ??
                    billing.subscriptionStatus}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ph-text-tertiary">Stripe ready</dt>
                <dd className="font-mono text-ph-text-secondary">
                  {billing.billingProviderReady ? "yes" : "no"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ph-text-tertiary">Checkout available</dt>
                <dd className="font-mono text-ph-text-secondary">
                  {billing.hasStripeClient ? "yes" : "no"}
                </dd>
              </div>
            </dl>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={
                !billing.hasStripeClient || checkoutMutation.isPending || !canUpgrade
              }
              onClick={() => checkoutMutation.mutate()}
              aria-label={
                canUpgrade
                  ? "Start Stripe Checkout for Phantom Pro"
                  : "Current plan"
              }
              className="rounded-md bg-ph-accent px-4 py-2 font-sans text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {!canUpgrade ? "Current plan" : "Subscribe with Stripe"}
            </button>
            <button
              type="button"
              disabled={
                !billing.stripeCustomerId ||
                portalMutation.isPending ||
                !billing.hasStripeClient
              }
              aria-busy={portalMutation.isPending}
              onClick={() => portalMutation.mutate()}
              className="rounded-md border border-ph-border px-4 py-2 font-sans text-xs text-ph-text-secondary transition-colors hover:bg-ph-raised/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Manage subscription
            </button>
          </div>

          {(checkoutMutation.isError || portalMutation.isError) && (
            <p className="font-sans text-xs text-ph-danger">
              {checkoutMutation.isError
                ? getQueryErrorMessage(checkoutMutation.error)
                : getQueryErrorMessage(portalMutation.error)}
            </p>
          )}

          {!billing.billingProviderReady && (
            <p className="font-sans text-xs text-ph-text-tertiary">
              Set <span className="font-mono">STRIPE_SECRET_KEY</span>,{" "}
              <span className="font-mono">STRIPE_WEBHOOK_SECRET</span>, and{" "}
              <span className="font-mono">STRIPE_PRICE_PAID_MONTHLY</span> on
              the API. Point Stripe webhooks to{" "}
              <span className="font-mono">/api/webhooks/stripe</span>.
            </p>
          )}

          <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
              What Pro unlocks (Phase 1)
            </div>
            <ul className="mt-3 list-inside list-disc space-y-1.5 font-sans text-xs text-ph-text-tertiary">
              <li>Unlimited email, phone, username, and password aliases</li>
              <li>Unlimited broker exposure scans (rolling 24h)</li>
              <li>
                Removal request queue (simulated — DIY opt-out links on all
                tiers)
              </li>
              <li>Stripe Customer Portal for subscription management</li>
            </ul>
          </section>
        </div>
      )}

      {meQuery.isSuccess && (
        <button
          type="button"
          className="mt-6 font-sans text-xs text-ph-text-muted underline"
          onClick={() => {
            void qc.invalidateQueries({
              queryKey: queryKeys.userMe(accessToken),
            });
            void qc.invalidateQueries({
              queryKey: queryKeys.billingStatus(accessToken),
            });
          }}
        >
          Refresh account
        </button>
      )}
    </div>
  );
}
