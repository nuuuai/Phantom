import type { User } from "@phantom/shared";
import { create } from "zustand";

function tierLabel(tier: User["tier"]): string {
  if (tier === "paid") return "PRO";
  if (tier === "enterprise") return "ENT";
  return "FREE";
}

interface SessionState {
  accessToken: string | null;
  displayName: string;
  planLabel: string;
  darkWebAlerts: number;
  setAccessToken: (token: string | null) => void;
  setUser: (user: Pick<User, "displayName" | "tier">) => void;
  setDarkWebAlerts: (count: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  displayName: "Operator",
  planLabel: "FREE",
  darkWebAlerts: 0,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) =>
    set({
      displayName: user.displayName,
      planLabel: tierLabel(user.tier),
    }),
  setDarkWebAlerts: (count) => set({ darkWebAlerts: count }),
}));
