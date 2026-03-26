import type { User } from "@phantom/shared";
import { create } from "zustand";

function tierLabel(tier: User["tier"]): string {
  if (tier === "paid") return "PRO";
  if (tier === "enterprise") return "ENT";
  return "FREE";
}

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string;
  displayName: string;
  planLabel: string;
  tier: User["tier"];
  darkWebAlerts: number;
  vaultKeyHex: string | null;
  loginPassword: string | null;
  /** Dev auto-login failure message; cleared on success or retry. */
  devBootstrapError: string | null;
  /** Bumps to re-run dev SessionBootstrap login (e.g. Retry in top bar). */
  devBootstrapRetryNonce: number;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setUser: (user: Pick<User, "displayName" | "tier" | "email">) => void;
  setDarkWebAlerts: (count: number) => void;
  setVaultKeyHex: (hex: string | null) => void;
  setLoginPassword: (pw: string | null) => void;
  setDevBootstrapError: (msg: string | null) => void;
  incrementDevBootstrapRetry: () => void;
  /** Clears tokens, vault key, and cached user fields (e.g. after sign out). */
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  refreshToken: null,
  email: "",
  displayName: "Operator",
  planLabel: "FREE",
  tier: "free",
  darkWebAlerts: 0,
  vaultKeyHex: null,
  loginPassword: null,
  devBootstrapError: null,
  devBootstrapRetryNonce: 0,
  setAccessToken: (token) => set({ accessToken: token }),
  setRefreshToken: (token) => set({ refreshToken: token }),
  setUser: (user) =>
    set({
      email: user.email,
      displayName: user.displayName,
      planLabel: tierLabel(user.tier),
      tier: user.tier,
    }),
  setDarkWebAlerts: (count) => set({ darkWebAlerts: count }),
  setVaultKeyHex: (hex) => set({ vaultKeyHex: hex }),
  setLoginPassword: (pw) => set({ loginPassword: pw }),
  setDevBootstrapError: (msg) => set({ devBootstrapError: msg }),
  incrementDevBootstrapRetry: () =>
    set((s) => ({
      devBootstrapRetryNonce: s.devBootstrapRetryNonce + 1,
      devBootstrapError: null,
    })),
  clearSession: () =>
    set({
      accessToken: null,
      refreshToken: null,
      email: "",
      displayName: "Operator",
      planLabel: "FREE",
      tier: "free",
      darkWebAlerts: 0,
      vaultKeyHex: null,
      loginPassword: null,
      devBootstrapError: null,
      devBootstrapRetryNonce: 0,
    }),
}));
