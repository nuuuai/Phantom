const ACCESS_TOKEN_KEY = "phantom_access_token" as const;
const REFRESH_TOKEN_KEY = "phantom_refresh_token" as const;
const VAULT_KEY_HEX_KEY = "phantom_vault_key_hex" as const;

export async function getAccessToken(): Promise<string | null> {
  const r = await chrome.storage.local.get(ACCESS_TOKEN_KEY);
  const v = r[ACCESS_TOKEN_KEY];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function setAccessToken(token: string | null): Promise<void> {
  if (token === null) {
    await chrome.storage.local.remove(ACCESS_TOKEN_KEY);
    return;
  }
  await chrome.storage.local.set({ [ACCESS_TOKEN_KEY]: token });
}

export async function getRefreshToken(): Promise<string | null> {
  const r = await chrome.storage.local.get(REFRESH_TOKEN_KEY);
  const v = r[REFRESH_TOKEN_KEY];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function setRefreshToken(token: string | null): Promise<void> {
  if (token === null) {
    await chrome.storage.local.remove(REFRESH_TOKEN_KEY);
    return;
  }
  await chrome.storage.local.set({ [REFRESH_TOKEN_KEY]: token });
}

export async function getVaultKeyHex(): Promise<string | null> {
  const r = await chrome.storage.local.get(VAULT_KEY_HEX_KEY);
  const v = r[VAULT_KEY_HEX_KEY];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function setVaultKeyHex(hex: string | null): Promise<void> {
  if (hex === null) {
    await chrome.storage.local.remove(VAULT_KEY_HEX_KEY);
    return;
  }
  await chrome.storage.local.set({ [VAULT_KEY_HEX_KEY]: hex });
}
