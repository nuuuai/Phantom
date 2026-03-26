import { Router } from "express";
import type { ApiResponse, DashboardOverview } from "@phantom/shared";

export const dashboardRouter = Router();

const overviewMock: DashboardOverview = {
  userId: "usr_demo",
  riskScore: 34,
  riskTrend: -12,
  activeAliases: 47,
  aliasesHealthy: 41,
  aliasesWarning: 4,
  aliasesCompromised: 2,
  brokersFound: 127,
  brokersRemoved: 89,
  brokersPending: 31,
  brokersRelisted: 7,
  callsScreened: 1284,
  scamsEngaged: 342,
  scammerMinutes: 4870,
  complaintsFile: 298,
  darkWebAlerts: 3,
  activity: [
    {
      type: "sword",
      label: "Scam engaged",
      desc: "IRS scam · Confused Retiree persona · 23 min",
      time: "2m",
    },
    {
      type: "shield",
      label: "Alias rotated",
      desc: "shopping_shade@phantom.id → new alias queued",
      time: "14m",
    },
    {
      type: "shield",
      label: "Broker removed",
      desc: "Spokeo confirmed removal of your profile",
      time: "1h",
    },
    {
      type: "brain",
      label: "Breach detected",
      desc: "Email alias found in LinkedIn data breach",
      time: "3h",
    },
    {
      type: "shield",
      label: "Call screened",
      desc: "Unknown caller identified as FedEx — forwarded",
      time: "4h",
    },
    {
      type: "autopilot",
      label: "Auto re-removal",
      desc: "WhitePages re-listed your data — removal re-submitted",
      time: "6h",
    },
  ],
  weeklyScams: [12, 18, 9, 24, 15, 21, 14],
  weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  systemLayers: [
    { name: "Shield", status: "47 aliases active", layer: "shield" },
    { name: "Brain", status: "Risk model updated 2h ago", layer: "brain" },
    { name: "Sword", status: "342 scammers engaged", layer: "sword" },
    { name: "Autopilot", status: "3 auto-actions today", layer: "autopilot" },
  ],
};

dashboardRouter.get("/metrics", (req, res) => {
  const userId = req.user?.id ?? "unknown";
  const response: ApiResponse<DashboardOverview> = {
    ok: true,
    data: { ...overviewMock, userId },
  };
  res.json(response);
});
