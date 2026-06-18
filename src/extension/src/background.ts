import type { Alias, ApiResponse, CopilotChatResponse, CopilotConfirmResponse, CopilotToolId } from "@phantom/shared";
import {
  clientErrorFromApiFailure,
  decryptVaultValue,
  deriveVaultKey,
  encryptVaultValue,
  exportKeyHex,
  generatePassword,
  importKeyHex,
  inferAliasCategory,
  normalizeClientError,
  pickAliasForSite,
  PHANTOM_API_ERROR_CODES,
} from "@phantom/shared";
import {
  EXTENSION_API_BASE_KEY,
  fetchAuth,
  getApiBaseUrl,
  validateApiBaseUrlInput,
} from "./lib/apiClient";
import {
  MESSAGE_FIELD_SCAN,
  MESSAGE_GENERATE_ALIAS,
  MESSAGE_COPILOT_CHAT,
  MESSAGE_COPILOT_CONFIRM,
  MESSAGE_LOGIN,
  MESSAGE_LOGOUT,
  type BackgroundMessage,
  type FieldKind,
} from "./lib/messages";
import { parseApiResponseJson } from "./lib/parseApiResponse.js";
import { getRefreshToken, setAccessToken, setRefreshToken } from "./lib/storage";
import {
  clearVaultStorage,
  getVaultKeyHex,
  persistVaultKeyHex,
} from "./lib/vaultStorage";
import { devLog } from "./lib/devLog.js";

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
  const base = await getApiBaseUrl();
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
  await persistVaultKeyHex(await exportKeyHex(key));
}

function aliasTypeForField(kind: FieldKind | undefined): "email" | "password" | "username" {
  if (kind === "password") return "password";
  if (kind === "username") return "username";
  return "email";
}

async function requestAlias(
  fieldKind: FieldKind | undefined,
  siteHostname?: string
): Promise<ApiResponse<{ alias: Alias }>> {
  const aliasType = aliasTypeForField(fieldKind);

  if (siteHostname) {
    const listRes = await fetchAuth("/api/aliases");
    const listParsed = await parseApiResponseJson<{ userId: string; items: Alias[] }>(
      listRes
    );
    if (listParsed.ok) {
      const existing = pickAliasForSite(
        siteHostname,
        listParsed.data.items.map((a) => ({
          id: a.id,
          type: a.type,
          category: a.category,
          serviceUrl: a.serviceUrl,
          serviceName: a.serviceName,
          value: a.value,
          isActive: a.isActive,
          healthStatus: a.healthStatus,
        })),
        aliasType
      );
      if (existing) {
        const alias = listParsed.data.items.find((a) => a.id === existing.id);
        if (alias) {
          return { ok: true, data: { alias } };
        }
      }
    }
  }

  let encryptedValue: string | undefined;
  if (aliasType === "password") {
    const vaultHex = await getVaultKeyHex();
    if (vaultHex) {
      const key = await importKeyHex(vaultHex);
      const plainPw = generatePassword(20);
      encryptedValue = await encryptVaultValue(key, plainPw);
    }
  }

  const inferredCategory = siteHostname
    ? inferAliasCategory(`https://${siteHostname}`)
    : null;
  const category = inferredCategory ?? "shopping";

  const response = await fetchAuth("/api/aliases/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: aliasType,
      category,
      serviceUrl: siteHostname ? `https://${siteHostname}` : undefined,
      serviceName: siteHostname ? siteHostname.replace(/^www\./, "") : undefined,
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

type CopilotChatResponseMsg =
  | { ok: true; data: CopilotChatResponse }
  | { ok: false; error: string };

type CopilotConfirmResponseMsg =
  | { ok: true; data: CopilotConfirmResponse }
  | { ok: false; error: string };

const COPILOT_TOOLS = new Set<CopilotToolId>([
  "start_broker_scan",
  "rotate_alias",
  "request_broker_removals",
  "generate_alias",
]);

async function revokeRefreshOnServer(): Promise<void> {
  const rt = await getRefreshToken();
  if (!rt) return;
  await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  }).catch(() => {});
}

chrome.runtime.onInstalled.addListener((details) => {
  void (async () => {
    if (details.reason !== "update") return;
    try {
      const r = await chrome.storage.local.get(EXTENSION_API_BASE_KEY);
      const v = r[EXTENSION_API_BASE_KEY];
      if (typeof v !== "string" || !v.trim()) return;
      const parsed = validateApiBaseUrlInput(v);
      if (!parsed.ok) {
        await chrome.storage.local.remove(EXTENSION_API_BASE_KEY);
        devLog("cleared invalid API base URL override after update");
      }
    } catch {
      /* ignore */
    }
  })();
});

chrome.runtime.onMessage.addListener(
  (
    message: BackgroundMessage,
    _sender,
    sendResponse: (
      response:
        | GenerateResponse
        | LoginResponse
        | LogoutResponse
        | CopilotChatResponseMsg
        | CopilotConfirmResponseMsg
        | { ok: true }
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
            const hex = await getVaultKeyHex();
            if (hex) {
              void import("./lib/vaultSync.js").then(({ pushVaultSyncFromExtension }) =>
                pushVaultSyncFromExtension(hex).then((r) => {
                  if (!r.ok) {
                    const msg =
                      r.error.length > 180
                        ? `${r.error.slice(0, 180)}…`
                        : r.error;
                    devLog("vault sync push failed", msg);
                  }
                })
              );
            }
            sendResponse({ ok: true });
          } else {
            const meta = clientErrorFromApiFailure(result);
            let errMsg = meta.message;
            if (result.error.code === PHANTOM_API_ERROR_CODES.tier_limit) {
              errMsg = `${errMsg} Open the Phantom dashboard → Billing to upgrade.`;
            } else if (
              result.error.code === PHANTOM_API_ERROR_CODES.rate_limited &&
              typeof result.error.retryAfterSeconds === "number" &&
              result.error.retryAfterSeconds > 0
            ) {
              errMsg = `${errMsg} Retry in ~${String(Math.ceil(result.error.retryAfterSeconds))}s.`;
            }
            sendResponse({ ok: false, error: errMsg });
          }
        })
        .catch((err: unknown) => {
          devLog("login failed", err);
          sendResponse({
            ok: false,
            error: normalizeClientError({
              code: PHANTOM_API_ERROR_CODES.network_error,
              message: "",
            }).userMessage,
          });
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
        await clearVaultStorage();
        sendResponse({ ok: true });
      })().catch(() => {
        sendResponse({ ok: false, error: "logout_failed" });
      });
      return true;
    }

    if (message.type === MESSAGE_GENERATE_ALIAS) {
      const fieldKind = message.fieldKind;
      const siteHostname = message.siteHostname;
      void (async () => {
        try {
          const result = await requestAlias(fieldKind, siteHostname);
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
            const meta = clientErrorFromApiFailure(result);
            let errMsg = meta.message;
            if (result.error.code === PHANTOM_API_ERROR_CODES.tier_limit) {
              errMsg = `${errMsg} Open the Phantom dashboard → Billing to upgrade.`;
            } else if (
              result.error.code === PHANTOM_API_ERROR_CODES.rate_limited &&
              typeof result.error.retryAfterSeconds === "number" &&
              result.error.retryAfterSeconds > 0
            ) {
              errMsg = `${errMsg} Retry in ~${String(Math.ceil(result.error.retryAfterSeconds))}s.`;
            }
            sendResponse({ ok: false, error: errMsg });
          }
        } catch (err: unknown) {
          devLog("generate alias failed", err);
          sendResponse({
            ok: false,
            error: normalizeClientError({
              code: PHANTOM_API_ERROR_CODES.network_error,
              message: "",
            }).userMessage,
          });
        }
      })();
      return true;
    }

    if (message.type === MESSAGE_COPILOT_CHAT) {
      void (async () => {
        try {
          const res = await fetchAuth("/api/copilot/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message.message }),
          });
          const data = await parseApiResponseJson<CopilotChatResponse>(res);
          if (data.ok) {
            sendResponse({ ok: true, data: data.data });
          } else {
            sendResponse({
              ok: false,
              error: clientErrorFromApiFailure(data).message,
            });
          }
        } catch {
          sendResponse({ ok: false, error: "network_error" });
        }
      })();
      return true;
    }

    if (message.type === MESSAGE_COPILOT_CONFIRM) {
      const toolId = message.toolId;
      if (!COPILOT_TOOLS.has(toolId as CopilotToolId)) {
        sendResponse({ ok: false, error: "invalid_tool" });
        return true;
      }
      void (async () => {
        try {
          const res = await fetchAuth("/api/copilot/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toolId,
              params: message.params,
            }),
          });
          const data = await parseApiResponseJson<CopilotConfirmResponse>(res);
          if (data.ok) {
            sendResponse({ ok: true, data: data.data });
          } else {
            sendResponse({
              ok: false,
              error: clientErrorFromApiFailure(data).message,
            });
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
