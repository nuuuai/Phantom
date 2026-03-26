import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function BillingPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const checkoutSessionId = searchParams.get("session_id");
  const canceledCheckout = searchParams.get("canceled");

  const billingQuery = useQuery({
    queryKey: queryKeys.billingStatus(accessToken),
    queryFn: async () => {
      const res = await phantomApi.billing.status(accessToken);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    enabled: accessToken !== null,
  });

  const meQuery = useQuery({
    queryKey: queryKeys.userMe(accessToken),
    queryFn: async () => {
      const res = await phantomApi.user.me(accessToken);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    enabled: accessToken !== null,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await phantomApi.billing.checkoutSession(accessToken!);
      if (!res.ok) throw new Error(res.error.message);
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
      const res = await phantomApi.billing.syncCheckoutSession(
        accessToken,
        checkoutSessionId
      );
      if (cancelled) return;
      if (!res.ok) return;
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
      if (!res.ok) throw new Error(res.error.message);
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
    <div className="px-8 py-6">
      <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
        Billing
      </h1>
      <p className="mt-1 max-w-xl font-sans text-sm text-ph-text-tertiary">
        Phantom Pro unlocks unlimited aliases and data broker removal. Stripe
        Checkout and Customer Portal activate when API keys are configured.
      </p>

      {billingQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">Loading…</p>
      )}
      {billingQuery.isError && (
        <p className="mt-8 font-sans text-sm text-ph-danger">
          {billingQuery.error instanceof Error
            ? billingQuery.error.message
            : "Could not load billing."}
        </p>
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
                  {billing.subscriptionStatus}
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
              className="rounded-md bg-ph-accent px-4 py-2 font-sans text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {!canUpgrade ? "Current plan" : "Upgrade with Stripe"}
            </button>
            <button
              type="button"
              disabled={
                !billing.stripeCustomerId ||
                portalMutation.isPending ||
                !billing.hasStripeClient
              }
              onClick={() => portalMutation.mutate()}
              className="rounded-md border border-ph-border px-4 py-2 font-sans text-xs text-ph-text-secondary transition-colors hover:bg-ph-raised/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Manage subscription
            </button>
          </div>

          {(checkoutMutation.isError || portalMutation.isError) && (
            <p className="font-sans text-xs text-ph-danger">
              {checkoutMutation.error instanceof Error
                ? checkoutMutation.error.message
                : portalMutation.error instanceof Error
                  ? portalMutation.error.message
                  : "Request failed"}
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
