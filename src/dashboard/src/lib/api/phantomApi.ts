import {
  type Alias,
  type ApiResponse,
  type BrokerScanResult,
  type BrokerScanStartResponse,
  type BrokerScanSummary,
  type DashboardOverview,
  type DataBroker,
  type GenerateAliasRequest,
  type NotificationPrefItem,
  type PatchAliasRequest,
  type PhantomNotification,
  type User,
  type UserAccountSnapshot,
  RATE_LIMIT_RETRY_MS,
} from "@phantom/shared";
import { useSessionStore } from "@/stores/useSessionStore.js";

type Token = string | null | undefined;

function buildUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base || base.length === 0) {
    return normalized;
  }
  return `${base.replace(/\/$/, "")}${normalized}`;
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  const data = (await response.json()) as ApiResponse<T>;
  if (!response.ok) {
    if (data.ok === false) {
      return data;
    }
    return {
      ok: false,
      error: { code: "http_error", message: `HTTP ${String(response.status)}` },
    };
  }
  return data;
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
  const data = (await r2.json()) as ApiResponse<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }>;
  if (!data.ok) return res;
  useSessionStore.getState().setAccessToken(data.data.accessToken);
  useSessionStore.getState().setRefreshToken(data.data.refreshToken);
  const headers2 = new Headers(init.headers);
  headers2.set("Authorization", `Bearer ${data.data.accessToken}`);
  let res2 = await fetch(url, { ...init, headers: headers2 });
  if (res2.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
    res2 = await fetch(url, { ...init, headers: headers2 });
  }
  return res2;
}

export const phantomApi = {
  health: async (): Promise<{
    status: string;
    service: string;
    redis?: string;
  }> => {
    const res = await fetch(buildUrl("/health"));
    if (!res.ok) {
      throw new Error("Health check failed");
    }
    return (await res.json()) as {
      status: string;
      service: string;
      redis?: string;
    };
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
      return parseJson(res);
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
      return parseJson(res);
    },
    refresh: async (
      refreshToken: string
    ): Promise<
      ApiResponse<{ user: User; accessToken: string; refreshToken: string }>
    > => {
      const res = await postRefresh(refreshToken);
      return parseJson(res);
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
      return parseJson(res);
    },
  },

  user: {
    me: async (
      accessToken: Token
    ): Promise<ApiResponse<UserAccountSnapshot>> => {
      const res = await fetchWithRefresh("/api/user/me", accessToken, {});
      return parseJson(res);
    },
  },

  dashboard: {
    overview: async (
      accessToken?: Token
    ): Promise<ApiResponse<DashboardOverview>> => {
      const res = await fetchWithRefresh(
        "/api/dashboard/metrics",
        accessToken ?? null,
        {}
      );
      return parseJson(res);
    },
  },

  brokerScan: {
    catalog: async (
      accessToken: Token
    ): Promise<ApiResponse<{ items: DataBroker[] }>> => {
      const res = await fetchWithRefresh("/api/broker-scan/catalog", accessToken, {});
      return parseJson(res);
    },

    start: async (
      accessToken: Token
    ): Promise<ApiResponse<BrokerScanStartResponse>> => {
      const res = await fetchWithRefresh("/api/broker-scan/start", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseJson(res);
    },

    summary: async (
      accessToken: Token
    ): Promise<ApiResponse<BrokerScanSummary>> => {
      const res = await fetchWithRefresh("/api/broker-scan/summary", accessToken, {});
      return parseJson(res);
    },

    results: async (
      accessToken: Token,
      params: { status?: string; q?: string }
    ): Promise<ApiResponse<{ userId: string; items: BrokerScanResult[] }>> => {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      if (params.q) q.set("q", params.q);
      const qs = q.toString();
      const path = qs
        ? `/api/broker-scan/results?${qs}`
        : "/api/broker-scan/results";
      const res = await fetchWithRefresh(path, accessToken, {});
      return parseJson(res);
    },

    removeAll: async (
      accessToken: Token
    ): Promise<ApiResponse<{ updated: number }>> => {
      const res = await fetchWithRefresh("/api/broker-scan/remove-all", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseJson(res);
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
      return parseJson(res);
    },
  },

  notifications: {
    list: async (
      accessToken: Token,
      params?: { unread?: boolean; limit?: number }
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
      const res = await fetchWithRefresh(path, accessToken, {});
      return parseJson(res);
    },

    count: async (
      accessToken: Token
    ): Promise<ApiResponse<{ unreadCount: number }>> => {
      const res = await fetchWithRefresh("/api/notifications/count", accessToken, {});
      return parseJson(res);
    },

    markRead: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ notification: PhantomNotification }>> => {
      const res = await fetchWithRefresh(`/api/notifications/${id}/read`, accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseJson(res);
    },

    markAllRead: async (
      accessToken: Token
    ): Promise<ApiResponse<{ updated: number }>> => {
      const res = await fetchWithRefresh("/api/notifications/read-all", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseJson(res);
    },

    seedDemo: async (
      accessToken: Token
    ): Promise<ApiResponse<{ seeded: number }>> => {
      const res = await fetchWithRefresh("/api/notifications/seed-demo", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseJson(res);
    },

    getPreferences: async (
      accessToken: Token
    ): Promise<ApiResponse<{ items: NotificationPrefItem[] }>> => {
      const res = await fetchWithRefresh("/api/notifications/preferences", accessToken, {});
      return parseJson(res);
    },

    updatePreferences: async (
      accessToken: Token,
      items: NotificationPrefItem[]
    ): Promise<ApiResponse<{ items: NotificationPrefItem[] }>> => {
      const res = await fetchWithRefresh("/api/notifications/preferences", accessToken, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      return parseJson(res);
    },
  },

  vault: {
    getSalt: async (
      accessToken: Token
    ): Promise<ApiResponse<{ vaultSalt: string | null }>> => {
      const res = await fetchWithRefresh("/api/vault/salt", accessToken, {});
      return parseJson(res);
    },

    init: async (
      accessToken: Token
    ): Promise<ApiResponse<{ vaultSalt: string }>> => {
      const res = await fetchWithRefresh("/api/vault/init", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return parseJson(res);
    },
  },

  aliases: {
    list: async (
      accessToken: Token,
      params: { category?: string; health?: string }
    ): Promise<ApiResponse<{ userId: string; items: Alias[] }>> => {
      const q = new URLSearchParams();
      if (params.category) q.set("category", params.category);
      if (params.health) q.set("health", params.health);
      const qs = q.toString();
      const path = qs ? `/api/aliases?${qs}` : "/api/aliases";
      const res = await fetchWithRefresh(path, accessToken, {});
      return parseJson(res);
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
      return parseJson(res);
    },

    get: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetchWithRefresh(`/api/aliases/${id}`, accessToken, {});
      return parseJson(res);
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
      return parseJson(res);
    },

    remove: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetchWithRefresh(`/api/aliases/${id}`, accessToken, {
        method: "DELETE",
      });
      return parseJson(res);
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
      return parseJson(res);
    },
  },
};
