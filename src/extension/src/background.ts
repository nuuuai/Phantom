import type { Alias, ApiResponse } from "@phantom/shared";
import {
  MESSAGE_FIELD_SCAN,
  MESSAGE_GENERATE_ALIAS,
  MESSAGE_LOGIN,
  type BackgroundMessage,
} from "./lib/messages";
import { getAccessToken, setAccessToken } from "./lib/storage";

function getApiBaseUrl(): string {
  return (
    process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:8787"
  ).replace(/\/$/, "");
}

async function loginRequest(
  email: string,
  password: string
): Promise<ApiResponse<{ user: { id: string; email: string }; accessToken: string }>> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return (await response.json()) as ApiResponse<{
    user: { id: string; email: string };
    accessToken: string;
  }>;
}

async function requestAlias(): Promise<ApiResponse<{ alias: Alias }>> {
  const token = await getAccessToken();
  if (!token) {
    return {
      ok: false,
      error: { code: "unauthorized", message: "Sign in from the popup first" },
    };
  }
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/aliases/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: "email",
      category: "shopping",
    }),
  });
  return (await response.json()) as ApiResponse<{ alias: Alias }>;
}

type GenerateResponse =
  | { ok: true; alias: Alias }
  | { ok: false; error: string };

type LoginResponse =
  | { ok: true }
  | { ok: false; error: string };

chrome.runtime.onMessage.addListener(
  (
    message: BackgroundMessage,
    _sender,
    sendResponse: (
      response: GenerateResponse | LoginResponse | { ok: true }
    ) => void
  ) => {
    if (message.type === MESSAGE_FIELD_SCAN) {
      sendResponse({ ok: true });
      return;
    }

    if (message.type === MESSAGE_LOGIN) {
      void loginRequest(message.email, message.password)
        .then(async (result) => {
          if (result.ok) {
            await setAccessToken(result.data.accessToken);
            sendResponse({ ok: true });
          } else {
            sendResponse({ ok: false, error: result.error.message });
          }
        })
        .catch(() => {
          sendResponse({ ok: false, error: "network_error" });
        });
      return true;
    }

    if (message.type === MESSAGE_GENERATE_ALIAS) {
      void requestAlias()
        .then((result) => {
          if (result.ok) {
            sendResponse({ ok: true, alias: result.data.alias });
          } else {
            sendResponse({ ok: false, error: result.error.message });
          }
        })
        .catch(() => {
          sendResponse({ ok: false, error: "network_error" });
        });
      return true;
    }

    return undefined;
  }
);
