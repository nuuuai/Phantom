import { Router } from "express";
import type { ApiResponse, User } from "@phantom/shared";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const body = req.body as { displayName?: string };
  const displayName =
    typeof body.displayName === "string" && body.displayName.length > 0
      ? body.displayName
      : "Operator";

  const payload: User = {
    id: "usr_mock_register",
    displayName,
    createdAt: new Date().toISOString(),
    tier: "paid",
  };

  const response: ApiResponse<{ user: User; accessToken: string }> = {
    ok: true,
    data: {
      user: payload,
      accessToken: "mock_access_token",
    },
  };
  res.status(201).json(response);
});

authRouter.post("/login", (_req, res) => {
  const payload: User = {
    id: "usr_mock_login",
    displayName: "Operator",
    createdAt: new Date().toISOString(),
    tier: "paid",
  };

  const response: ApiResponse<{ user: User; accessToken: string }> = {
    ok: true,
    data: {
      user: payload,
      accessToken: "mock_access_token",
    },
  };
  res.json(response);
});
