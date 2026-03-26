import type {
  Alias,
  ApiResponse,
  DashboardOverview,
  User,
} from "@phantom/shared";

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
      displayName: string
    ): Promise<ApiResponse<{ user: User; accessToken: string }>> => {
      const res = await fetch(buildUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      return parseJson(res);
    },
    login: async (): Promise<
      ApiResponse<{ user: User; accessToken: string }>
    > => {
      const res = await fetch(buildUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return parseJson(res);
    },
  },

  dashboard: {
    overview: async (
      accessToken?: string
    ): Promise<ApiResponse<DashboardOverview>> => {
      const headers: HeadersInit = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const res = await fetch(buildUrl("/api/dashboard/metrics"), { headers });
      return parseJson(res);
    },
  },

  aliases: {
    list: async (
      accessToken?: string
    ): Promise<ApiResponse<{ userId: string; items: Alias[] }>> => {
      const headers: HeadersInit = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const res = await fetch(buildUrl("/api/aliases"), { headers });
      return parseJson(res);
    },
  },
};
