import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCount = vi.fn();
vi.mock("./prisma.js", () => ({
  prisma: {
    alias: {
      count: (...args: unknown[]) => mockCount(...args) as Promise<number>,
    },
  },
}));

import { assertCanCreateAlias } from "./aliasTierLimits.js";

describe("assertCanCreateAlias", () => {
  beforeEach(() => {
    mockCount.mockReset();
  });

  it("allows paid tier without counting", async () => {
    const r = await assertCanCreateAlias("u1", "paid", "email");
    expect(r).toEqual({ ok: true });
    expect(mockCount).not.toHaveBeenCalled();
  });

  it("returns tier_limit with machine-readable fields when free tier at cap", async () => {
    mockCount.mockResolvedValue(3);
    const r = await assertCanCreateAlias("u1", "free", "email");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected failure");
    expect(r.tierLimit).toEqual({ aliasType: "email", used: 3, max: 3 });
    expect(r.message).toMatch(/Upgrade to Phantom Pro/);
  });

  it("enforces username cap on free tier", async () => {
    mockCount.mockResolvedValue(5);
    const r = await assertCanCreateAlias("u1", "free", "username");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected failure");
    expect(r.tierLimit).toEqual({ aliasType: "username", used: 5, max: 5 });
  });
});
