import {
  type Alias,
  type AliasInboxItem,
  type AliasInboxListMeta,
  type ApiResponse,
  type BillingStatus,
  type BrokerScanResult,
  type BrokerScanStartResponse,
  type BrokerScanSummary,
  type BrokerRemovalPriorityItem,
  type DashboardOverview,
  type DataBroker,
  type GenerateAliasRequest,
  type NotificationPrefItem,
  type PatchAliasRequest,
  type PhoneProviderStatus,
  type PhantomNotification,
  type User,
  type UserAccountSnapshot,
  type VaultSyncGetResponse,
  type VaultSyncPutRequest,
  type DarkWebFindingPublic,
  type DarkWebFindingsListResponse,
  type DarkWebFindingsSummary,
  type DarkWebRefreshResult,
  type CallGuardSummary,
  type CallGuardLiveEvent,
  type AliasRotationCandidatesSummary,
  type PrivacyDigest,
  type ScamEngagementSummary,
  type ThreatPattern,
  type ExposureReport,
  type FamilySnapshot,
  type UserAiPreferences,
  type AliasHealthIntel,
  type InboxSummary,
  type AccountExportPayload,
  type AccountDeleteRequest,
  type AccountDeleteResult,
  type DarkWebImpactSummary,
  type BillingValueSummary,
  type AliasRelationshipMap,
  type CallGuardActiveSession,
  type CopilotChatResponse,
  type CopilotConfirmRequest,
  type CopilotConfirmResponse,
  type CopilotStatusResponse,
  RATE_LIMIT_RETRY_MS,
} from "@phantom/shared";
import { useSessionStore } from "@/stores/useSessionStore.js";
import { parseApiResponseJson } from "./parseApiResponse.js";

type Token = string | null | undefined;

function buildUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base || base.length === 0) {
    return normalized;
  }
  return `${base.replace(/\/$/, "")}${normalized}`;
}

async function postRefresh(refreshToken: string): Promise<Response> {
  const refreshUrl = buildUrl("/api/auth/refresh");
  const body = JSON.stringify({ refreshToken });
  let r = await fetch(refreshUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (r.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
    r = await fetch(refreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }
  return r;
}

/** Authenticated request: on 401, refresh session once and retry. */
async function fetchWithRefresh(
  path: string,
  accessToken: Token,
  init: RequestInit = {}
): Promise<Response> {
  const url = buildUrl(path);
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  let res = await fetch(url, { ...init, headers });
  if (res.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
    res = await fetch(url, { ...init, headers });
  }
  if (res.status !== 401 || !accessToken) return res;
  const rt = useSessionStore.getState().refreshToken;
  if (!rt) return res;
  const r2 = await postRefresh(rt);
  const refreshParsed = await parseApiResponseJson<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }>(r2);
  if (!refreshParsed.ok) return res;
  useSessionStore.getState().setAccessToken(refreshParsed.data.accessToken);
  useSessionStore.getState().setRefreshToken(refreshParsed.data.refreshToken);
  const headers2 = new Headers(init.headers);
  headers2.set(
    "Authorization",
    `Bearer ${refreshParsed.data.accessToken}`
  );
  let res2 = await fetch(url, { ...init, headers: headers2 });
  if (res2.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
    res2 = await fetch(url, { ...init, headers: headers2 });
  }
  return res2;
}

async function parseHealthPayload(
  res: Response
): Promise<{ status: string; service: string; redis?: string }> {
  if (!res.ok) {
    throw new Error("Health check failed");
  }
  const text = await res.text();
  if (!text.trim()) {
    throw new Error("Health check failed");
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!/application\/json|\+json/i.test(contentType)) {
    throw new Error("Health check failed");
  }
  try {
    return JSON.parse(text) as {
      status: string;
      service: string;
      redis?: string;
    };
  } catch {
    throw new Error("Health check failed");
  }
}

export const phantomApi = {
  health: async (): Promise<{
    status: string;
    service: string;
    redis?: string;
  }> => {
    const res = await fetch(buildUrl("/health"));
    return parseHealthPayload(res);
  },

  auth: {
    register: async (
      email: string,
      password: string
    ): Promise<
      ApiResponse<{ user: User; accessToken: string; refreshToken?: string }>
    > => {
      const res = await fetch(buildUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return parseApiResponseJson(res);
    },
    login: async (
      email: string,
      password: string
    ): Promise<
      ApiResponse<{ user: User; accessToken: string; refreshToken?: string }>
    > => {
      const res = await fetch(buildUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return parseApiResponseJson(res);
    },
    refresh: async (
      refreshToken: string
    ): Promise<
      ApiResponse<{ user: User; accessToken: string; refreshToken: string }>
    > => {
      const res = await postRefresh(refreshToken);
      return parseApiResponseJson(res);
    },
    logout: async (
      refreshToken?: string | null
    ): Promise<ApiResponse<Record<string, never>>> => {
      const res = await fetch(buildUrl("/api/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          refreshToken ? { refreshToken } : {}
        ),
      });
      return parseApiResponseJson(res);
    },
  },

  user: {
    me: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<UserAccountSnapshot>> => {
      const res = await fetchWithRefresh("/api/user/me", accessToken, init ?? {});
      return parseApiResponseJson(res);
    },

    patchMe: async (
      accessToken: Token,
      body: { forwardToEmail: string | null }
    ): Promise<ApiResponse<UserAccountSnapshot>> => {
      const res = await fetchWithRefresh("/api/user/me", accessToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parseApiResponseJson(res);
    },

    patchPreferences: async (
      accessToken: Token,
      body: Partial<UserAiPreferences>
    ): Promise<ApiResponse<UserAiPreferences>> => {
      const res = await fetchWithRefresh("/api/user/preferences", accessToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parseApiResponseJson(res);
    },

    exportAccount: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<AccountExportPayload>> => {
      const res = await fetchWithRefresh("/api/user/export", accessToken, init ?? {});
      return parseApiResponseJson(res);
    },

    deleteAccount: async (
      accessToken: Token,
      body: AccountDeleteRequest
    ): Promise<ApiResponse<AccountDeleteResult>> => {
      const res = await fetchWithRefresh("/api/user/me", accessToken, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parseApiResponseJson(res);
    },
  },

  callGuard: {
    logs: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<CallGuardSummary>> => {
      const res = await fetchWithRefresh(
        "/api/call-guard/logs",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    streamLive: async (
      accessToken: Token,
      opts: {
        signal?: AbortSignal;
        onEvent: (event: CallGuardLiveEvent) => void;
      }
    ): Promise<void> => {
      const res = await fetchWithRefresh(
        "/api/call-guard/live/stream",
        accessToken,
        { signal: opts.signal }
      );
      if (!res.ok) {
        const parsed = await parseApiResponseJson<never>(res);
        throw new Error(
          !parsed.ok ? parsed.error.message : "Call Guard stream failed"
        );
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          opts.onEvent(JSON.parse(trimmed) as CallGuardLiveEvent);
        }
      }
      const tail = buffer.trim();
      if (tail) {
        opts.onEvent(JSON.parse(tail) as CallGuardLiveEvent);
      }
    },

    activeSession: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<{ session: CallGuardActiveSession | null }>> => {
      const res = await fetchWithRefresh(
        "/api/call-guard/sessions/active",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },
  },

  scamEngage: {
    sessions: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<ScamEngagementSummary>> => {
      const res = await fetchWithRefresh(
        "/api/scam-engage/sessions",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },
  },

  threatIntel: {
    patterns: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<{ patterns: ThreatPattern[] }>> => {
      const res = await fetchWithRefresh(
        "/api/threat-intel/patterns",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },
  },

  reports: {
    latest: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<{ report: ExposureReport }>> => {
      const res = await fetchWithRefresh(
        "/api/reports/latest",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    digest: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<PrivacyDigest>> => {
      const res = await fetchWithRefresh(
        "/api/reports/digest",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    digestEmail: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<
      ApiResponse<{ to: string | null; subject: string; body: string }>
    > => {
      const res = await fetchWithRefresh(
        "/api/reports/digest/email",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },
  },

  family: {
    snapshot: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<FamilySnapshot>> => {
      const res = await fetchWithRefresh(
        "/api/family/snapshot",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },
  },

  intelligence: {
    aliasIntel: async (
      accessToken: Token,
      aliasId: string,
      init?: RequestInit
    ): Promise<ApiResponse<AliasHealthIntel>> => {
      const res = await fetchWithRefresh(
        `/api/intelligence/aliases/${aliasId}/intel`,
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    inboxSummary: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<InboxSummary>> => {
      const res = await fetchWithRefresh(
        "/api/intelligence/inbox/summary",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    rotationCandidates: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<AliasRotationCandidatesSummary>> => {
      const res = await fetchWithRefresh(
        "/api/intelligence/aliases/rotation-candidates",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    flagInboxAlias: async (
      accessToken: Token,
      messageId: string
    ): Promise<ApiResponse<{ aliasId: string; healthStatus: string }>> => {
      const res = await fetchWithRefresh(
        `/api/intelligence/inbox/messages/${encodeURIComponent(messageId)}/flag-alias`,
        accessToken,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      return parseApiResponseJson(res);
    },

    relationshipMap: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<AliasRelationshipMap>> => {
      const res = await fetchWithRefresh(
        "/api/intelligence/aliases/relationship-map",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },
  },

  emailInbox: {
    list: async (
      accessToken: Token,
      limitOrOpts?:
        | number
        | {
            limit?: number;
            offset?: number;
            q?: string;
            unread?: boolean;
          },
      init?: RequestInit
    ): Promise<
      ApiResponse<{ items: AliasInboxItem[]; meta: AliasInboxListMeta }>
    > => {
      const opts =
        typeof limitOrOpts === "number"
          ? { limit: limitOrOpts }
          : (limitOrOpts ?? {});
      const params = new URLSearchParams();
      if (opts.limit !== undefined) {
        params.set("limit", String(opts.limit));
      }
      if (opts.offset !== undefined && opts.offset > 0) {
        params.set("offset", String(opts.offset));
      }
      if (opts.q?.trim()) {
        params.set("q", opts.q.trim());
      }
      if (opts.unread) {
        params.set("unread", "1");
      }
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchWithRefresh(
        `/api/email-inbox${qs}`,
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    patchRead: async (
      accessToken: Token,
      id: string,
      isRead: boolean
    ): Promise<ApiResponse<{ item: AliasInboxItem }>> => {
      const res = await fetchWithRefresh(
        `/api/email-inbox/${encodeURIComponent(id)}/read`,
        accessToken,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead }),
        }
      );
      return parseApiResponseJson(res);
    },
  },

  phone: {
    provider: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<PhoneProviderStatus>> => {
      const res = await fetchWithRefresh(
        "/api/phone/provider",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },
  },

  dashboard: {
    overview: async (
      accessToken?: Token,
      init?: RequestInit
    ): Promise<ApiResponse<DashboardOverview>> => {
      const res = await fetchWithRefresh(
        "/api/dashboard/metrics",
        accessToken ?? null,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },
  },

  darkWeb: {
    summary: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<DarkWebFindingsSummary>> => {
      const res = await fetchWithRefresh(
        "/api/dark-web/summary",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    findings: async (
      accessToken: Token,
      opts?: { limit?: number; offset?: number },
      init?: RequestInit
    ): Promise<ApiResponse<DarkWebFindingsListResponse>> => {
      const params = new URLSearchParams();
      if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
      if (opts?.offset !== undefined) params.set("offset", String(opts.offset));
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchWithRefresh(
        `/api/dark-web/findings${qs}`,
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    impact: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<DarkWebImpactSummary>> => {
      const res = await fetchWithRefresh(
        "/api/dark-web/impact",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    refresh: async (accessToken: Token): Promise<
      ApiResponse<DarkWebRefreshResult>
    > => {
      const res = await fetchWithRefresh("/api/dark-web/refresh", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseApiResponseJson(res);
    },

    dismiss: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ finding: DarkWebFindingPublic }>> => {
      const res = await fetchWithRefresh(
        `/api/dark-web/findings/${encodeURIComponent(id)}`,
        accessToken,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "dismissed" }),
        }
      );
      return parseApiResponseJson(res);
    },

    seedDemo: async (
      accessToken: Token
    ): Promise<ApiResponse<{ seeded: number }>> => {
      const res = await fetchWithRefresh(
        "/api/dark-web/seed-demo",
        accessToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      return parseApiResponseJson(res);
    },
  },

  brokerScan: {
    catalog: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<{ items: DataBroker[] }>> => {
      const res = await fetchWithRefresh(
        "/api/broker-scan/catalog",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    start: async (
      accessToken: Token
    ): Promise<ApiResponse<BrokerScanStartResponse>> => {
      const res = await fetchWithRefresh("/api/broker-scan/start", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseApiResponseJson(res);
    },

    summary: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<BrokerScanSummary>> => {
      const res = await fetchWithRefresh(
        "/api/broker-scan/summary",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    removalPriority: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<{ items: BrokerRemovalPriorityItem[] }>> => {
      const res = await fetchWithRefresh(
        "/api/broker-scan/removal-priority",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    results: async (
      accessToken: Token,
      params: { status?: string; q?: string },
      init?: RequestInit
    ): Promise<ApiResponse<{ userId: string; items: BrokerScanResult[] }>> => {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      if (params.q) q.set("q", params.q);
      const qs = q.toString();
      const path = qs
        ? `/api/broker-scan/results?${qs}`
        : "/api/broker-scan/results";
      const res = await fetchWithRefresh(path, accessToken, init ?? {});
      return parseApiResponseJson(res);
    },

    removeAll: async (
      accessToken: Token
    ): Promise<ApiResponse<{ updated: number }>> => {
      const res = await fetchWithRefresh("/api/broker-scan/remove-all", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseApiResponseJson(res);
    },

    requestRemoval: async (
      accessToken: Token,
      resultId: string
    ): Promise<ApiResponse<{ result: BrokerScanResult }>> => {
      const res = await fetchWithRefresh(
        `/api/broker-scan/${resultId}/request-removal`,
        accessToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      return parseApiResponseJson(res);
    },
  },

  notifications: {
    list: async (
      accessToken: Token,
      params?: { unread?: boolean; limit?: number },
      init?: RequestInit
    ): Promise<
      ApiResponse<{ items: PhantomNotification[]; unreadCount: number }>
    > => {
      const q = new URLSearchParams();
      if (params?.unread) q.set("unread", "true");
      if (params?.limit) q.set("limit", String(params.limit));
      const qs = q.toString();
      const path = qs
        ? `/api/notifications?${qs}`
        : "/api/notifications";
      const res = await fetchWithRefresh(path, accessToken, init ?? {});
      return parseApiResponseJson(res);
    },

    count: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<{ unreadCount: number }>> => {
      const res = await fetchWithRefresh(
        "/api/notifications/count",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    markRead: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ notification: PhantomNotification }>> => {
      const res = await fetchWithRefresh(`/api/notifications/${id}/read`, accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseApiResponseJson(res);
    },

    markAllRead: async (
      accessToken: Token
    ): Promise<ApiResponse<{ updated: number }>> => {
      const res = await fetchWithRefresh("/api/notifications/read-all", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseApiResponseJson(res);
    },

    seedDemo: async (
      accessToken: Token
    ): Promise<ApiResponse<{ seeded: number }>> => {
      const res = await fetchWithRefresh("/api/notifications/seed-demo", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseApiResponseJson(res);
    },

    getPreferences: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<{ items: NotificationPrefItem[] }>> => {
      const res = await fetchWithRefresh(
        "/api/notifications/preferences",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    updatePreferences: async (
      accessToken: Token,
      items: NotificationPrefItem[],
      init?: RequestInit
    ): Promise<ApiResponse<{ items: NotificationPrefItem[] }>> => {
      const res = await fetchWithRefresh("/api/notifications/preferences", accessToken, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        signal: init?.signal,
      });
      return parseApiResponseJson(res);
    },
  },

  vault: {
    getSalt: async (
      accessToken: Token
    ): Promise<ApiResponse<{ vaultSalt: string | null }>> => {
      const res = await fetchWithRefresh("/api/vault/salt", accessToken, {});
      return parseApiResponseJson(res);
    },

    init: async (
      accessToken: Token
    ): Promise<ApiResponse<{ vaultSalt: string }>> => {
      const res = await fetchWithRefresh("/api/vault/init", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseApiResponseJson(res);
    },

    getSync: async (
      accessToken: Token
    ): Promise<ApiResponse<VaultSyncGetResponse>> => {
      const res = await fetchWithRefresh("/api/vault/sync", accessToken, {});
      return parseApiResponseJson(res);
    },

    putSync: async (
      accessToken: Token,
      body: VaultSyncPutRequest
    ): Promise<ApiResponse<{ version: number }>> => {
      const res = await fetchWithRefresh("/api/vault/sync", accessToken, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parseApiResponseJson(res);
    },
  },

  billing: {
    status: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<BillingStatus>> => {
      const res = await fetchWithRefresh(
        "/api/billing/status",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    checkoutSession: async (
      accessToken: Token
    ): Promise<ApiResponse<{ url: string | null }>> => {
      const res = await fetchWithRefresh(
        "/api/billing/checkout-session",
        accessToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      return parseApiResponseJson(res);
    },

    portalSession: async (
      accessToken: Token
    ): Promise<ApiResponse<{ url: string | null }>> => {
      const res = await fetchWithRefresh(
        "/api/billing/portal-session",
        accessToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      return parseApiResponseJson(res);
    },

    syncCheckoutSession: async (
      accessToken: Token,
      sessionId: string
    ): Promise<ApiResponse<{ synced: true }>> => {
      const res = await fetchWithRefresh(
        "/api/billing/sync-checkout-session",
        accessToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        }
      );
      return parseApiResponseJson(res);
    },

    valueSummary: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<BillingValueSummary>> => {
      const res = await fetchWithRefresh(
        "/api/billing/value-summary",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },
  },

  copilot: {
    status: async (
      accessToken: Token,
      init?: RequestInit
    ): Promise<ApiResponse<CopilotStatusResponse>> => {
      const res = await fetchWithRefresh(
        "/api/copilot/status",
        accessToken,
        init ?? {}
      );
      return parseApiResponseJson(res);
    },

    chat: async (
      accessToken: Token,
      message: string,
      init?: RequestInit
    ): Promise<ApiResponse<CopilotChatResponse>> => {
      const res = await fetchWithRefresh("/api/copilot/chat", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        ...init,
      });
      return parseApiResponseJson(res);
    },

    confirm: async (
      accessToken: Token,
      body: CopilotConfirmRequest,
      init?: RequestInit
    ): Promise<ApiResponse<CopilotConfirmResponse>> => {
      const res = await fetchWithRefresh("/api/copilot/confirm", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        ...init,
      });
      return parseApiResponseJson(res);
    },
  },

  aliases: {
    list: async (
      accessToken: Token,
      params: { category?: string; health?: string },
      init?: RequestInit
    ): Promise<ApiResponse<{ userId: string; items: Alias[] }>> => {
      const q = new URLSearchParams();
      if (params.category) q.set("category", params.category);
      if (params.health) q.set("health", params.health);
      const qs = q.toString();
      const path = qs ? `/api/aliases?${qs}` : "/api/aliases";
      const res = await fetchWithRefresh(path, accessToken, init ?? {});
      return parseApiResponseJson(res);
    },

    generate: async (
      accessToken: Token,
      body: GenerateAliasRequest
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetchWithRefresh("/api/aliases/generate", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parseApiResponseJson(res);
    },

    get: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetchWithRefresh(`/api/aliases/${id}`, accessToken, {});
      return parseApiResponseJson(res);
    },

    patch: async (
      accessToken: Token,
      id: string,
      body: PatchAliasRequest
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetchWithRefresh(`/api/aliases/${id}`, accessToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parseApiResponseJson(res);
    },

    remove: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetchWithRefresh(`/api/aliases/${id}`, accessToken, {
        method: "DELETE",
      });
      return parseApiResponseJson(res);
    },

    rotate: async (
      accessToken: Token,
      id: string,
      body?: { encryptedValue?: string }
    ): Promise<ApiResponse<{ previousId: string; alias: Alias }>> => {
      const res = await fetchWithRefresh(`/api/aliases/${id}/rotate`, accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return parseApiResponseJson(res);
    },
  },
};
