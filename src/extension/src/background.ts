import type { Alias, ApiResponse } from "@phantom/shared";
import {
  decryptVaultValue,
  deriveVaultKey,
  encryptVaultValue,
  exportKeyHex,
  generatePassword,
  importKeyHex,
} from "@phantom/shared";
import { fetchAuth, getApiBaseUrl } from "./lib/apiClient";
import {
  MESSAGE_FIELD_SCAN,
  MESSAGE_GENERATE_ALIAS,
  MESSAGE_LOGIN,
  MESSAGE_LOGOUT,
  type BackgroundMessage,
  type FieldKind,
} from "./lib/messages";
import { parseApiResponseJson } from "./lib/parseApiResponse.js";
import {
  getRefreshToken,
  getVaultKeyHex,
  setAccessToken,
  setRefreshToken,
  setVaultKeyHex,
} from "./lib/storage";

async function loginRequest(
  email: string,
  password: string
): Promise<
  ApiResponse<{
    user: { id: string; email: string };
    accessToken: string;
    refreshToken?: string;
  }>
> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseApiResponseJson<{
    user: { id: string; email: string };
    accessToken: string;
    refreshToken?: string;
  }>(response);
}

async function initVaultKey(
  _accessToken: string,
  password: string
): Promise<void> {
  const saltRes = await fetchAuth("/api/vault/salt");
  const saltData = await parseApiResponseJson<{
    vaultSalt: string | null;
  }>(saltRes);

  let salt: string | null = null;
  if (saltData.ok) salt = saltData.data.vaultSalt;

  if (!salt) {
    const initRes = await fetchAuth("/api/vault/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const initData = await parseApiResponseJson<{
      vaultSalt: string;
    }>(initRes);
    if (initData.ok) salt = initData.data.vaultSalt;
  }

  if (!salt) return;

  const key = await deriveVaultKey(password, salt);
  await setVaultKeyHex(await exportKeyHex(key));
}

function aliasTypeForField(kind: FieldKind | undefined): "email" | "password" | "username" {
  if (kind === "password") return "password";
  if (kind === "username") return "username";
  return "email";
}

async function requestAlias(
  fieldKind: FieldKind | undefined
): Promise<ApiResponse<{ alias: Alias }>> {
  const aliasType = aliasTypeForField(fieldKind);

  let encryptedValue: string | undefined;
  if (aliasType === "password") {
    const vaultHex = await getVaultKeyHex();
    if (vaultHex) {
      const key = await importKeyHex(vaultHex);
      const plainPw = generatePassword(20);
      encryptedValue = await encryptVaultValue(key, plainPw);
    }
  }

  const response = await fetchAuth("/api/aliases/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: aliasType,
      category: "shopping",
      encryptedValue,
    }),
  });
  return parseApiResponseJson<{ alias: Alias }>(response);
}

type GenerateResponse =
  | { ok: true; alias: Alias; plainValue?: string }
  | { ok: false; error: string };

type LoginResponse =
  | { ok: true }
  | { ok: false; error: string };

type LogoutResponse = { ok: true } | { ok: false; error: string };

async function revokeRefreshOnServer(): Promise<void> {
  const rt = await getRefreshToken();
  if (!rt) return;
  await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  }).catch(() => {});
}

chrome.runtime.onMessage.addListener(
  (
    message: BackgroundMessage,
    _sender,
    sendResponse: (
      response: GenerateResponse | LoginResponse | LogoutResponse | { ok: true }
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
            await setRefreshToken(result.data.refreshToken ?? null);
            await initVaultKey(result.data.accessToken, message.password);
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

    if (message.type === MESSAGE_LOGOUT) {
      void (async () => {
        try {
          await revokeRefreshOnServer();
        } catch {
          /* ignore revoke network errors; still clear local session */
        }
        await setAccessToken(null);
        await setRefreshToken(null);
        await setVaultKeyHex(null);
        sendResponse({ ok: true });
      })().catch(() => {
        sendResponse({ ok: false, error: "logout_failed" });
      });
      return true;
    }

    if (message.type === MESSAGE_GENERATE_ALIAS) {
      const fieldKind = message.fieldKind;
      void (async () => {
        try {
          const result = await requestAlias(fieldKind);
          if (result.ok) {
            const alias = result.data.alias;
            let plainValue: string | undefined;

            if (alias.encryptedValue) {
              const vaultHex = await getVaultKeyHex();
              if (vaultHex) {
                const key = await importKeyHex(vaultHex);
                plainValue = await decryptVaultValue(key, alias.encryptedValue);
              }
            }

            sendResponse({ ok: true, alias, plainValue });
          } else {
            sendResponse({ ok: false, error: result.error.message });
          }
        } catch {
          sendResponse({ ok: false, error: "network_error" });
        }
      })();
      return true;
    }

    return undefined;
  }
);
