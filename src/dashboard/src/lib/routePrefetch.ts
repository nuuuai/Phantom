import { clientErrorFromApiFailure } from "@phantom/shared";
import { queryClient } from "@/lib/queryClient.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";

/**
 * Warm cache for heavy routes on nav hover/focus (deduped with active queries).
 */
export function prefetchDashboardRoute(
  path: string,
  accessToken: string | null
): void {
  if (!accessToken) return;
  const p = path.replace(/\/$/, "") || "/";

  if (p === "/brokers" || p.startsWith("/brokers")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.brokerScanSummary(accessToken),
      queryFn: async ({ signal }) => {
        const res = await phantomApi.brokerScan.summary(accessToken, {
          signal,
        });
        if (!res.ok) throw clientErrorFromApiFailure(res);
        return res.data;
      },
      staleTime: STALE.brokerScanSummary,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.brokerScanCatalog(accessToken),
      queryFn: async ({ signal }) => {
        const res = await phantomApi.brokerScan.catalog(accessToken, {
          signal,
        });
        if (!res.ok) throw clientErrorFromApiFailure(res);
        return res.data.items;
      },
      staleTime: STALE.brokerScanCatalog,
    });
    return;
  }

  if (p === "/vault" || p.startsWith("/vault")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.userMe(accessToken),
      queryFn: async ({ signal }) => {
        const res = await phantomApi.user.me(accessToken, { signal });
        if (!res.ok) throw clientErrorFromApiFailure(res);
        return res.data;
      },
      staleTime: STALE.userMe,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.vaultList(accessToken, "all"),
      queryFn: async ({ signal }) => {
        const res = await phantomApi.aliases.list(accessToken, {}, { signal });
        if (!res.ok) throw clientErrorFromApiFailure(res);
        return res.data.items.filter((a) => a.type === "password");
      },
      staleTime: STALE.aliasesList,
    });
    return;
  }

  if (p === "/inbox" || p.startsWith("/inbox")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.emailInbox(accessToken, "", false),
      queryFn: async ({ signal }) => {
        const res = await phantomApi.emailInbox.list(
          accessToken,
          { limit: 60 },
          { signal }
        );
        if (!res.ok) throw clientErrorFromApiFailure(res);
        return res.data.items;
      },
      staleTime: STALE.emailInbox,
    });
    return;
  }

  if (p === "/dark-web" || p.startsWith("/dark-web")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.darkWebSummary(accessToken),
      queryFn: async ({ signal }) => {
        const res = await phantomApi.darkWeb.summary(accessToken, { signal });
        if (!res.ok) throw clientErrorFromApiFailure(res);
        return res.data;
      },
      staleTime: STALE.darkWeb,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.darkWebFindings(accessToken),
      queryFn: async ({ signal }) => {
        const res = await phantomApi.darkWeb.findings(accessToken, { signal });
        if (!res.ok) throw clientErrorFromApiFailure(res);
        return res.data;
      },
      staleTime: STALE.darkWeb,
    });
    return;
  }

  if (p === "/billing" || p.startsWith("/billing")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.billingStatus(accessToken),
      queryFn: async ({ signal }) => {
        const res = await phantomApi.billing.status(accessToken, { signal });
        if (!res.ok) throw clientErrorFromApiFailure(res);
        return res.data;
      },
      staleTime: STALE.billingStatus,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.userMe(accessToken),
      queryFn: async ({ signal }) => {
        const res = await phantomApi.user.me(accessToken, { signal });
        if (!res.ok) throw clientErrorFromApiFailure(res);
        return res.data;
      },
      staleTime: STALE.userMe,
    });
  }
}
