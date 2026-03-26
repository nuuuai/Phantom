import { RATE_LIMIT_RETRY_MS } from "@phantom/shared";
import { parseApiResponseJson } from "./parseApiResponse.js";
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

function networkFailureResponse(): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: "network_error",
        message:
          "Could not reach the Phantom API. Check your network and PLASMO_PUBLIC_API_URL.",
      },
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}

const REFRESH_503_BACKOFF_MS = 2000;

export async function refreshSession(): Promise<boolean> {
  const rt = await getRefreshToken();
  if (!rt) return false;
  const url = `${getApiBaseUrl()}/api/auth/refresh`;
  const body = JSON.stringify({ refreshToken: rt });
  const postRefresh = () =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

  let res: Response;
  try {
    res = await postRefresh();
    /** Transient overload / deploy: retry once after backoff (Stripe-style idempotency elsewhere). */
    if (res.status === 503) {
      await new Promise((resolve) =>
        setTimeout(resolve, REFRESH_503_BACKOFF_MS)
      );
      res = await postRefresh();
    }
    if (res.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      res = await postRefresh();
    }
  } catch {
    return false;
  }
  const data = await parseApiResponseJson<{
    accessToken: string;
    refreshToken: string;
  }>(res);
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
  try {
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
  } catch {
    return networkFailureResponse();
  }
}
