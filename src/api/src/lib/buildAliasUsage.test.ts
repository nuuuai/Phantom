import { beforeEach, describe, expect, it, vi } from "vitest";
import { FREE_TIER_ALIAS_MAX } from "@phantom/shared";

const mockCount = vi.fn();
vi.mock("./prisma.js", () => ({
  prisma: {
    alias: {
      count: (...args: unknown[]) => mockCount(...args) as Promise<number>,
    },
  },
}));

import { buildAliasUsage } from "./buildAliasUsage.js";

describe("buildAliasUsage", () => {
  beforeEach(() => {
    mockCount.mockReset();
    mockCount.mockResolvedValue(2);
  });

  it("returns max null for paid tier (unlimited password aliases)", async () => {
    const rows = await buildAliasUsage("u1", "paid");
    expect(rows.every((r) => r.max === null)).toBe(true);
    expect(rows.find((r) => r.type === "password")).toEqual({
      type: "password",
      used: 2,
      max: null,
    });
    expect(mockCount).toHaveBeenCalledTimes(4);
  });

  it("returns max null for enterprise tier", async () => {
    const rows = await buildAliasUsage("u1", "enterprise");
    expect(rows.find((r) => r.type === "email")?.max).toBeNull();
  });

  it("uses FREE_TIER_ALIAS_MAX for free tier", async () => {
    const rows = await buildAliasUsage("u1", "free");
    expect(rows.find((r) => r.type === "password")?.max).toBe(
      FREE_TIER_ALIAS_MAX.password
    );
  });
});
