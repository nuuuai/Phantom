import type {
  Alias,
  ApiResponse,
  BrokerScanResult,
  BrokerScanStartResponse,
  BrokerScanSummary,
  DashboardOverview,
  DataBroker,
  GenerateAliasRequest,
  PatchAliasRequest,
  PhantomNotification,
  User,
  UserAccountSnapshot,
} from "@phantom/shared";

type Token = string | null | undefined;

function bearerHeaders(token: Token): HeadersInit {
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function jsonAuthHeaders(token: Token): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

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

export const phantomApi = {
  health: async (): Promise<{ status: string; service: string }> => {
    const res = await fetch(buildUrl("/health"));
    if (!res.ok) {
      throw new Error("Health check failed");
    }
    return (await res.json()) as { status: string; service: string };
  },

  auth: {
    register: async (
      email: string,
      password: string
    ): Promise<ApiResponse<{ user: User; accessToken: string }>> => {
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
    ): Promise<ApiResponse<{ user: User; accessToken: string }>> => {
      const res = await fetch(buildUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return parseJson(res);
    },
  },

  user: {
    me: async (
      accessToken: Token
    ): Promise<ApiResponse<UserAccountSnapshot>> => {
      const res = await fetch(buildUrl("/api/user/me"), {
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },
  },

  dashboard: {
    overview: async (
      accessToken?: Token
    ): Promise<ApiResponse<DashboardOverview>> => {
      const res = await fetch(buildUrl("/api/dashboard/metrics"), {
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },
  },

  brokerScan: {
    catalog: async (
      accessToken: Token
    ): Promise<ApiResponse<{ items: DataBroker[] }>> => {
      const res = await fetch(buildUrl("/api/broker-scan/catalog"), {
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },

    start: async (
      accessToken: Token
    ): Promise<ApiResponse<BrokerScanStartResponse>> => {
      const res = await fetch(buildUrl("/api/broker-scan/start"), {
        method: "POST",
        headers: jsonAuthHeaders(accessToken),
      });
      return parseJson(res);
    },

    summary: async (
      accessToken: Token
    ): Promise<ApiResponse<BrokerScanSummary>> => {
      const res = await fetch(buildUrl("/api/broker-scan/summary"), {
        headers: bearerHeaders(accessToken),
      });
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
      const res = await fetch(buildUrl(path), {
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },

    removeAll: async (
      accessToken: Token
    ): Promise<ApiResponse<{ updated: number }>> => {
      const res = await fetch(buildUrl("/api/broker-scan/remove-all"), {
        method: "POST",
        headers: jsonAuthHeaders(accessToken),
      });
      return parseJson(res);
    },

    requestRemoval: async (
      accessToken: Token,
      resultId: string
    ): Promise<ApiResponse<{ result: BrokerScanResult }>> => {
      const res = await fetch(
        buildUrl(`/api/broker-scan/${resultId}/request-removal`),
        {
          method: "POST",
          headers: jsonAuthHeaders(accessToken),
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
      const res = await fetch(buildUrl(path), {
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },

    count: async (
      accessToken: Token
    ): Promise<ApiResponse<{ unreadCount: number }>> => {
      const res = await fetch(buildUrl("/api/notifications/count"), {
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },

    markRead: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ notification: PhantomNotification }>> => {
      const res = await fetch(buildUrl(`/api/notifications/${id}/read`), {
        method: "POST",
        headers: jsonAuthHeaders(accessToken),
      });
      return parseJson(res);
    },

    markAllRead: async (
      accessToken: Token
    ): Promise<ApiResponse<{ updated: number }>> => {
      const res = await fetch(buildUrl("/api/notifications/read-all"), {
        method: "POST",
        headers: jsonAuthHeaders(accessToken),
      });
      return parseJson(res);
    },

    seedDemo: async (
      accessToken: Token
    ): Promise<ApiResponse<{ seeded: number }>> => {
      const res = await fetch(buildUrl("/api/notifications/seed-demo"), {
        method: "POST",
        headers: jsonAuthHeaders(accessToken),
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
      const res = await fetch(buildUrl(path), {
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },

    generate: async (
      accessToken: Token,
      body: GenerateAliasRequest
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetch(buildUrl("/api/aliases/generate"), {
        method: "POST",
        headers: jsonAuthHeaders(accessToken),
        body: JSON.stringify(body),
      });
      return parseJson(res);
    },

    get: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetch(buildUrl(`/api/aliases/${id}`), {
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },

    patch: async (
      accessToken: Token,
      id: string,
      body: PatchAliasRequest
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetch(buildUrl(`/api/aliases/${id}`), {
        method: "PATCH",
        headers: jsonAuthHeaders(accessToken),
        body: JSON.stringify(body),
      });
      return parseJson(res);
    },

    remove: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ alias: Alias }>> => {
      const res = await fetch(buildUrl(`/api/aliases/${id}`), {
        method: "DELETE",
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },

    rotate: async (
      accessToken: Token,
      id: string
    ): Promise<ApiResponse<{ previousId: string; alias: Alias }>> => {
      const res = await fetch(buildUrl(`/api/aliases/${id}/rotate`), {
        method: "POST",
        headers: bearerHeaders(accessToken),
      });
      return parseJson(res);
    },
  },
};
