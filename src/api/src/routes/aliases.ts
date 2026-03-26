import { Router } from "express";
import type { Alias, ApiResponse } from "@phantom/shared";
import { HEALTH_STATES } from "@phantom/shared";

export const aliasesRouter = Router();

const mockAliases: Alias[] = [
  {
    id: "als_001",
    label: "Shopping — checkout",
    address: "shade+shop.demo@phantom.id",
    categoryId: "shopping",
    healthScore: 92,
    healthState: HEALTH_STATES[0],
    createdAt: new Date().toISOString(),
    parentIdentityId: "idn_primary",
  },
  {
    id: "als_002",
    label: "Newsletter",
    address: "shade+news.demo@phantom.id",
    categoryId: "other",
    healthScore: 78,
    healthState: HEALTH_STATES[1],
    createdAt: new Date().toISOString(),
    parentIdentityId: "idn_primary",
  },
];

aliasesRouter.get("/", (req, res) => {
  const userId = req.user?.id ?? "unknown";
  const response: ApiResponse<{ userId: string; items: Alias[] }> = {
    ok: true,
    data: { userId, items: mockAliases },
  };
  res.json(response);
});

aliasesRouter.post("/generate", (req, res) => {
  const body = req.body as { categoryId?: string; label?: string };
  const categoryId =
    typeof body.categoryId === "string" && body.categoryId.length > 0
      ? body.categoryId
      : "other";
  const label =
    typeof body.label === "string" && body.label.length > 0
      ? body.label
      : "Generated alias";

  const created: Alias = {
    id: `als_${Date.now().toString(36)}`,
    label,
    address: `shade+gen.${Date.now().toString(36)}@phantom.id`,
    categoryId,
    healthScore: 100,
    healthState: HEALTH_STATES[0],
    createdAt: new Date().toISOString(),
    parentIdentityId: "idn_primary",
  };

  const response: ApiResponse<{ alias: Alias }> = {
    ok: true,
    data: { alias: created },
  };
  res.status(201).json(response);
});
