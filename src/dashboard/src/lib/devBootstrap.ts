/** When set, SessionBootstrap skips the automatic dev login (e.g. after Sign out). */
export const SKIP_DEV_BOOTSTRAP_KEY = "phantom_skip_dev_bootstrap" as const;

export function shouldSkipDevBootstrap(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(SKIP_DEV_BOOTSTRAP_KEY) === "1";
}

export function setSkipDevBootstrap(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(SKIP_DEV_BOOTSTRAP_KEY, "1");
}

export function clearSkipDevBootstrap(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(SKIP_DEV_BOOTSTRAP_KEY);
}
