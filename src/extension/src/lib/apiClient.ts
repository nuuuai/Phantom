import { RATE_LIMIT_RETRY_MS } from "@phantom/shared";
import { parseApiResponseJson } from "./parseApiResponse.js";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "./storage";

/** User override in `chrome.storage.local` (options page). */
export const EXTENSION_API_BASE_KEY = "phantom_api_base_url" as const;

const DEFAULT_BUILD_API_BASE = (
  process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:8787"
).replace(/\/$/, "");

/**
 * Validates user-entered API origin (options page). No remote code; URL API only.
 */
export function validateApiBaseUrlInput(
  raw: string
): { ok: true; url: string } | { ok: false; error: string } {
  const t = raw.trim();
  if (t.length === 0) {
    return { ok: false, error: "Enter a URL or clear the field to use the build default." };
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: "Use http:// or https:// (production should be https://)." };
    }
    const path = u.pathname.replace(/\/$/, "");
    const base =
      path.length > 0 && path !== "/"
        ? `${u.origin}${path}`
        : u.origin;
    return { ok: true, url: base };
  } catch {
    return { ok: false, error: "Invalid URL. Example: https://api.example.com" };
  }
}

/**
 * Effective API origin: optional `chrome.storage.local` override, else build-time
 * `PLASMO_PUBLIC_API_URL` (inlined by Plasmo).
 */
export async function getApiBaseUrl(): Promise<string> {
  try {
    const r = await chrome.storage.local.get(EXTENSION_API_BASE_KEY);
    const v = r[EXTENSION_API_BASE_KEY];
    if (typeof v === "string" && v.trim().length > 0) {
      const parsed = validateApiBaseUrlInput(v);
      if (parsed.ok) return parsed.url;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_BUILD_API_BASE;
}

async function resolveUrl(path: string): Promise<string> {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = await getApiBaseUrl();
  return `${base}${p}`;
}

function networkFailureResponse(): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: "network_error",
        message:
          "Could not reach the Phantom API. Check your network and API URL (extension options).",
      },
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}

/** Max POST /api/auth/refresh attempts when the API returns 503 or 429 (transient). */
const REFRESH_MAX_ATTEMPTS = 4;
/** First wait before retry; then 500→1000→2000→… capped at 8000 ms between attempts. */
const REFRESH_BACKOFF_START_MS = 500;

export async function refreshSession(): Promise<boolean> {
  const rt = await getRefreshToken();
  if (!rt) return false;
  const url = `${await getApiBaseUrl()}/api/auth/refresh`;
  const body = JSON.stringify({ refreshToken: rt });
  const postRefresh = () =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

  let res!: Response;
  try {
    let backoffMs = REFRESH_BACKOFF_START_MS;
    for (let attempt = 0; attempt < REFRESH_MAX_ATTEMPTS; attempt++) {
      res = await postRefresh();
      if (res.status !== 503 && res.status !== 429) break;
      if (attempt === REFRESH_MAX_ATTEMPTS - 1) break;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      backoffMs = Math.min(backoffMs * 2, 8000);
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
  const url = await resolveUrl(path);
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
