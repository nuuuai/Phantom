import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { BrokerResultsPanel } from "./BrokerResultsPanel.js";
import { BrokerUpgradeModal } from "./BrokerUpgradeModal.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import {
  brokerScanCatalogAll,
  brokerScanResultsAll,
  brokerScanSummaryAll,
  dashboardOverviewAll,
  queryKeys,
} from "@/lib/queryKeys.js";
import { useSessionStore } from "@/stores/useSessionStore.js";
import {
  clientErrorFromApiFailure,
  formatBrokerScanRateLimit,
  getQueryErrorMessage,
  type BrokerScanSummary,
  type ClientErrorMeta,
  FREE_TIER_BROKER_SCAN_MAX_PER_24H,
} from "@phantom/shared";

function freeTierScanFootnote(summary: BrokerScanSummary | undefined): string {
  if (!summary) {
    return `Rolling 24h cap defaults to ${String(FREE_TIER_BROKER_SCAN_MAX_PER_24H)} · server truth: GET /api/broker-scan/summary`;
  }
  if (summary.canRequestRemoval) {
    return `Pro: unlimited scans / 24h · automated removal queue is simulated (Phase 1)`;
  }
  const cap = summary.freeTierBrokerScanMaxPer24h;
  if (cap === null) {
    return `Free tier: scans uncapped in this env · Pro adds simulated removal queue`;
  }
  return `Free tier: ${String(cap)} full scans / rolling 24h (same value as 429 scan_rate_limited) · Pro: unlimited`;
}

type TabId = "all" | "found" | "pending" | "removed" | "relisted";

function tabToStatus(tab: TabId): string | undefined {
  if (tab === "all") return undefined;
  if (tab === "found") return "found";
  if (tab === "pending") return "pending";
  if (tab === "removed") return "removed";
  if (tab === "relisted") return "relisted";
  return undefined;
}

export function BrokersPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabId>("all");
  const [searchQ, setSearchQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [removalBusyId, setRemovalBusyId] = useState<string | null>(null);
  const [scanLimitMessage, setScanLimitMessage] = useState<string | null>(null);
  const [scanErrorMessage, setScanErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQ), 320);
    return () => window.clearTimeout(t);
  }, [searchQ]);

  const statusParam = tabToStatus(tab);

  const summaryQuery = useQuery({
    queryKey: queryKeys.brokerScanSummary(accessToken),
    queryFn: async () => {
      const res = await phantomApi.brokerScan.summary(accessToken);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
  });

  const catalogQuery = useQuery({
    queryKey: queryKeys.brokerScanCatalog(accessToken),
    queryFn: async () => {
      const res = await phantomApi.brokerScan.catalog(accessToken);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.items;
    },
    enabled: accessToken !== null,
  });

  const resultsQuery = useQuery({
    queryKey: queryKeys.brokerScanResults(
      accessToken,
      statusParam ?? "all",
      debouncedQ
    ),
    queryFn: async () => {
      const res = await phantomApi.brokerScan.results(accessToken, {
        status: statusParam,
        q: debouncedQ.length > 0 ? debouncedQ : undefined,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.items;
    },
    enabled: accessToken !== null && (summaryQuery.data?.totalScanned ?? 0) > 0,
  });

  const hasScan = (summaryQuery.data?.totalScanned ?? 0) > 0;

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await phantomApi.brokerScan.start(accessToken);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    onSuccess: () => {
      setScanLimitMessage(null);
      setScanErrorMessage(null);
      void (async () => {
        await queryClient.invalidateQueries({
          queryKey: brokerScanSummaryAll,
        });
        await queryClient.invalidateQueries({
          queryKey: brokerScanResultsAll,
        });
        await queryClient.invalidateQueries({
          queryKey: dashboardOverviewAll,
        });
      })();
    },
    onError: (e: Error) => {
      const ce = e as ClientErrorMeta;
      if (ce.apiErrorCode === "scan_rate_limited") {
        setScanLimitMessage(
          formatBrokerScanRateLimit(e.message, ce.retryAfterSeconds)
        );
        setScanErrorMessage(null);
        return;
      }
      setScanErrorMessage(getQueryErrorMessage(e));
    },
  });

  const removeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await phantomApi.brokerScan.removeAll(accessToken);
      if (!res.ok) {
        if (res.error.code === "upgrade_required") {
          setUpgradeOpen(true);
        }
        throw clientErrorFromApiFailure(res);
      }
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: brokerScanCatalogAll,
      });
      await queryClient.invalidateQueries({
        queryKey: brokerScanSummaryAll,
      });
      await queryClient.invalidateQueries({
        queryKey: brokerScanResultsAll,
      });
      await queryClient.invalidateQueries({
        queryKey: dashboardOverviewAll,
      });
    },
  });

  const requestRemovalMutation = useMutation({
    mutationFn: async (resultId: string) => {
      setRemovalBusyId(resultId);
      try {
        const res = await phantomApi.brokerScan.requestRemoval(
          accessToken,
          resultId
        );
        if (!res.ok) {
          if (res.error.code === "upgrade_required") {
            setUpgradeOpen(true);
          }
          throw clientErrorFromApiFailure(res);
        }
        return res.data;
      } finally {
        setRemovalBusyId(null);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: brokerScanResultsAll,
      });
      await queryClient.invalidateQueries({
        queryKey: brokerScanSummaryAll,
      });
      await queryClient.invalidateQueries({
        queryKey: dashboardOverviewAll,
      });
    },
  });

  const summary = summaryQuery.data;
  const catalogNames = useMemo(
    () => (catalogQuery.data ?? []).map((b) => b.name),
    [catalogQuery.data]
  );

  const exposureForModal = summary?.exposureCount ?? 0;

  if (!accessToken) {
    return <SessionGateMessage />;
  }

  if (summaryQuery.isPending && !summaryQuery.data) {
    return (
      <div className="px-8 py-6 font-sans text-sm text-ph-text-tertiary">
        Loading broker intelligence…
      </div>
    );
  }

  if (summaryQuery.isError && !summaryQuery.data) {
    return (
      <div className="px-8 py-6">
        <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
          Data brokers
        </h1>
        <p className="mt-3 font-sans text-sm text-ph-danger">
          {getQueryErrorMessage(summaryQuery.error)}
        </p>
        <button
          type="button"
          className="mt-4 rounded-md border border-ph-border bg-ph-raised px-4 py-2 font-sans text-xs text-ph-text-primary hover:bg-ph-border/40"
          onClick={() => void summaryQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const showPreScan = !hasScan;
  const showResults = hasScan && summary;

  return (
    <div className="px-8 py-6">
      <BrokerUpgradeModal
        open={upgradeOpen}
        exposureCount={exposureForModal}
        onClose={() => setUpgradeOpen(false)}
      />

      {scanLimitMessage ? (
        <div
          className="mb-4 rounded-lg border border-ph-warning/40 bg-ph-warning/10 px-4 py-3 font-sans text-sm text-ph-warning"
          role="alert"
        >
          {scanLimitMessage}
          {summary?.canRequestRemoval === false ? (
            <span className="mt-2 block font-sans text-xs text-ph-text-tertiary">
              Upgrade to Pro for unlimited scans (see Billing).
            </span>
          ) : null}
        </div>
      ) : null}
      {scanErrorMessage ? (
        <div
          className="mb-4 rounded-lg border border-ph-danger/40 bg-ph-danger/10 px-4 py-3 font-sans text-sm text-ph-danger"
          role="alert"
        >
          {scanErrorMessage}
          <button
            type="button"
            className="mt-2 block font-sans text-xs text-ph-accent-light underline-offset-2 hover:underline"
            onClick={() => void startMutation.mutate()}
          >
            Retry scan
          </button>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
            Data brokers
          </h1>
          <p className="mt-1 font-sans text-sm text-ph-text-tertiary">
            Exposure scan and removal queue — Shield layer
          </p>
          <p className="mt-2 max-w-2xl font-sans text-xs text-ph-text-muted">
            Expand any exposed broker for{" "}
            <span className="text-ph-text-tertiary">self-service removal</span>{" "}
            links (all tiers). Phantom Pro queues removal requests in addition
            to DIY opt-out.
          </p>
        </div>
        {hasScan ? (
          <button
            type="button"
            disabled={startMutation.isPending}
            onClick={() => {
              setScanErrorMessage(null);
              startMutation.mutate();
            }}
            className="rounded-[7px] border border-ph-border bg-ph-raised px-4 py-2 font-sans text-xs font-medium text-ph-text-secondary transition-colors duration-150 hover:border-ph-text-muted hover:text-ph-text-primary disabled:opacity-50"
          >
            {startMutation.isPending ? "Scanning…" : "Scan again"}
          </button>
        ) : null}
      </div>

      {showPreScan ? (
        <div className="rounded-xl border border-ph-border bg-ph-surface p-8">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ph-text-tertiary">
            Layer 1 · Shield · First exposure scan
          </div>
          <h2 className="mt-3 max-w-xl font-sans text-xl font-semibold text-ph-text-primary">
            See who&apos;s selling your data
          </h2>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-ph-text-tertiary">
            Data brokers aggregate public records, marketing lists, and people
            search indexes. We scan the broker registry for your profile signals
            — name, phone, email, and address — so you can see exposure before
            requesting removal.
          </p>
          <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-ph-text-tertiary">
            Phase 1 runs a deterministic simulation (no live broker queries).
            Production workers will parallelize real scans with rate limits per
            site.
          </p>
          <p className="mt-4 max-w-2xl font-sans text-[11px] leading-relaxed text-ph-text-muted">
            <span className="font-medium text-ph-text-tertiary">Status legend:</span>{" "}
            <span className="text-ph-warning">Pending</span> = removal queued (Pro
            simulation). <span className="text-ph-success">Removed</span> =
            confirmed in sim. <span className="text-ph-danger">Re-listed</span> =
            exposure returned — re-queue or DIY.
          </p>
          <button
            type="button"
            disabled={startMutation.isPending}
            onClick={() => {
              setScanErrorMessage(null);
              startMutation.mutate();
            }}
            className="mt-8 rounded-[8px] border border-ph-accent-border bg-[#6C3AED15] px-6 py-3 font-sans text-sm font-semibold text-ph-accent-light shadow-[0_0_20px_rgba(108,58,237,0.12)] transition-[transform,background-color] duration-200 hover:bg-[#6C3AED22] disabled:opacity-50"
          >
            {startMutation.isPending
              ? "Scanning…"
              : summary?.canRequestRemoval
                ? "Start exposure scan"
                : "Start free scan"}
          </button>
          <p className="mt-4 font-mono text-[11px] text-ph-text-ghost">
            ~2 minutes · {catalogNames.length || 50}+ broker sites ·{" "}
            {freeTierScanFootnote(summary)}
          </p>
        </div>
      ) : null}

      {showResults && summary ? (
        resultsQuery.isPending ? (
          <div className="font-sans text-sm text-ph-text-tertiary">
            Loading results…
          </div>
        ) : (
          <BrokerResultsPanel
            summary={summary}
            items={resultsQuery.data ?? []}
            tab={tab}
            onTab={setTab}
            searchQ={searchQ}
            onSearchQ={setSearchQ}
            onRemoveAll={() => removeAllMutation.mutate()}
            onRequestRemoval={(id) => requestRemovalMutation.mutate(id)}
            onUpgrade={() => setUpgradeOpen(true)}
            removeAllBusy={removeAllMutation.isPending}
            removalBusyId={removalBusyId}
          />
        )
      ) : null}
    </div>
  );
}
