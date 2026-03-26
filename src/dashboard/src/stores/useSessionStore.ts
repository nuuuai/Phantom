import type { User } from "@phantom/shared";
import { create } from "zustand";

function tierLabel(tier: User["tier"]): string {
  if (tier === "paid") return "PRO";
  if (tier === "enterprise") return "ENT";
  return "FREE";
}

interface SessionState {
  accessToken: string | null;
  email: string;
  displayName: string;
  planLabel: string;
  tier: User["tier"];
  darkWebAlerts: number;
  setAccessToken: (token: string | null) => void;
  setUser: (user: Pick<User, "displayName" | "tier" | "email">) => void;
  setDarkWebAlerts: (count: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  email: "",
  displayName: "Operator",
  planLabel: "FREE",
  tier: "free",
  darkWebAlerts: 0,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) =>
    set({
      email: user.email,
      displayName: user.displayName,
      planLabel: tierLabel(user.tier),
      tier: user.tier,
    }),
  setDarkWebAlerts: (count) => set({ darkWebAlerts: count }),
}));
