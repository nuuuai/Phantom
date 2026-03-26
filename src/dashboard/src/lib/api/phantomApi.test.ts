import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getState: vi.fn(() => ({
    refreshToken: "refresh-token",
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
  })),
}));

vi.mock("@/stores/useSessionStore.js", () => ({
  useSessionStore: {
    getState: () => mocks.getState(),
  },
}));

import { phantomApi } from "./phantomApi.js";

describe("phantomApi", () => {
  beforeEach(() => {
    mocks.getState.mockReturnValue({
      refreshToken: "refresh-token",
      setAccessToken: vi.fn(),
      setRefreshToken: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchWithRefresh: empty refresh body yields structured failure (no throw)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : String(input);
      if (url.includes("/api/auth/refresh")) {
        return new Response("", {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("", {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await phantomApi.user.me("access-token");

    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error.code).toBe("invalid_response");
    }
  });

  it("fetchWithRefresh: successful refresh updates tokens and retries /me", async () => {
    const setAccessToken = vi.fn();
    const setRefreshToken = vi.fn();
    mocks.getState.mockReturnValue({
      refreshToken: "rt",
      setAccessToken,
      setRefreshToken,
    });

    let meCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : String(input);
      if (url.includes("/api/auth/refresh")) {
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              user: {
                id: "u1",
                email: "a@b.c",
                displayName: "Dev",
                createdAt: "2020-01-01T00:00:00.000Z",
                tier: "free",
              },
              accessToken: "new-access",
              refreshToken: "new-refresh",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/api/user/me")) {
        meCalls += 1;
        if (meCalls === 1) {
          return new Response("", {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              user: {
                id: "u1",
                email: "a@b.c",
                displayName: "Dev",
                createdAt: "2020-01-01T00:00:00.000Z",
                tier: "free",
              },
              aliasUsage: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`unexpected fetch url: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await phantomApi.user.me("old-access");

    expect(out.ok).toBe(true);
    expect(setAccessToken).toHaveBeenCalledWith("new-access");
    expect(setRefreshToken).toHaveBeenCalledWith("new-refresh");
    expect(meCalls).toBe(2);
  });

  it("health rejects empty body without throwing SyntaxError", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response("", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    );

    await expect(phantomApi.health()).rejects.toThrow("Health check failed");
  });
});
