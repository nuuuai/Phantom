import type { Alias, ApiResponse } from "@phantom/shared";
import {
  MESSAGE_FIELD_SCAN,
  MESSAGE_GENERATE_ALIAS,
  type BackgroundMessage,
} from "./lib/messages";

function getApiBaseUrl(): string {
  return (
    process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:8787"
  ).replace(/\/$/, "");
}

async function requestAlias(): Promise<ApiResponse<{ alias: Alias }>> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/aliases/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer extension_dev",
    },
    body: JSON.stringify({ categoryId: "shopping", label: "Extension" }),
  });
  return (await response.json()) as ApiResponse<{ alias: Alias }>;
}

type GenerateResponse =
  | { ok: true; alias: Alias }
  | { ok: false; error: string };

chrome.runtime.onMessage.addListener(
  (
    message: BackgroundMessage,
    _sender,
    sendResponse: (response: GenerateResponse | { ok: true }) => void
  ) => {
    if (message.type === MESSAGE_FIELD_SCAN) {
      sendResponse({ ok: true });
      return;
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
