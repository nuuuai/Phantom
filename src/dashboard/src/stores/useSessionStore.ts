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
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setUser: (user: Pick<User, "displayName" | "tier" | "email">) => void;
  setDarkWebAlerts: (count: number) => void;
  setVaultKeyHex: (hex: string | null) => void;
  setLoginPassword: (pw: string | null) => void;
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
    }),
}));
