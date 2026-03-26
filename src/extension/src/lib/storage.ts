const ACCESS_TOKEN_KEY = "phantom_access_token" as const;

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
