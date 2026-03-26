import type { ApiResponse } from "@phantom/shared";
import { RATE_LIMIT_RETRY_MS } from "@phantom/shared";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "./storage";

export function getApiBaseUrl(): string {
  return (
    process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:8787"
  ).replace(/\/$/, "");
}

function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${p}`;
}

export async function refreshSession(): Promise<boolean> {
  const rt = await getRefreshToken();
  if (!rt) return false;
  const url = `${getApiBaseUrl()}/api/auth/refresh`;
  const body = JSON.stringify({ refreshToken: rt });
  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (res.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }
  const data = (await res.json()) as ApiResponse<{
    accessToken: string;
    refreshToken: string;
  }>;
  if (!data.ok) return false;
  await setAccessToken(data.data.accessToken);
  await setRefreshToken(data.data.refreshToken);
  return true;
}

/**
 * Authenticated fetch with one 401 → refresh → retry cycle.
 */
export async function fetchAuth(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = resolveUrl(path);
  const token = await getAccessToken();
  if (!token) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: "unauthorized",
          message: "Sign in from the popup first",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  let res = await fetch(url, { ...init, headers });
  if (res.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
    res = await fetch(url, { ...init, headers });
  }
  if (res.status !== 401) return res;
  const ok = await refreshSession();
  if (!ok) return res;
  const token2 = await getAccessToken();
  if (!token2) return res;
  const h2 = new Headers(init.headers);
  h2.set("Authorization", `Bearer ${token2}`);
  let res2 = await fetch(url, { ...init, headers: h2 });
  if (res2.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
    res2 = await fetch(url, { ...init, headers: h2 });
  }
  return res2;
}
