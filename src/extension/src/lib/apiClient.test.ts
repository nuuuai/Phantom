import { afterEach, describe, expect, it, vi } from "vitest";

const storageMock = vi.hoisted(() => ({
  getRefreshToken: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
}));

vi.mock("./storage.js", () => ({
  getRefreshToken: () => storageMock.getRefreshToken(),
  setAccessToken: (t: string | null) => storageMock.setAccessToken(t),
  setRefreshToken: (t: string | null) => storageMock.setRefreshToken(t),
}));

describe("getApiBaseUrl", () => {
  it("defaults to localhost:8787 without trailing slash", async () => {
    vi.resetModules();
    const prev = process.env.PLASMO_PUBLIC_API_URL;
    delete process.env.PLASMO_PUBLIC_API_URL;
    const { getApiBaseUrl } = await import("./apiClient.js");
    expect(getApiBaseUrl()).toBe("http://localhost:8787");
    process.env.PLASMO_PUBLIC_API_URL = prev;
  });

  it("strips trailing slash from PLASMO_PUBLIC_API_URL", async () => {
    vi.resetModules();
    const prev = process.env.PLASMO_PUBLIC_API_URL;
    process.env.PLASMO_PUBLIC_API_URL = "http://localhost:9999/";
    const { getApiBaseUrl } = await import("./apiClient.js");
    expect(getApiBaseUrl()).toBe("http://localhost:9999");
    process.env.PLASMO_PUBLIC_API_URL = prev;
  });
});

describe("refreshSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns false without throwing when refresh response body is empty", async () => {
    storageMock.getRefreshToken.mockResolvedValue("rt");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("", {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    const { refreshSession } = await import("./apiClient.js");
    await expect(refreshSession()).resolves.toBe(false);
  });

  it("returns true and persists tokens when refresh returns valid JSON", async () => {
    storageMock.getRefreshToken.mockResolvedValue("old-rt");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              accessToken: "new-at",
              refreshToken: "new-rt",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    const { refreshSession } = await import("./apiClient.js");
    await expect(refreshSession()).resolves.toBe(true);
    expect(storageMock.setAccessToken).toHaveBeenCalledWith("new-at");
    expect(storageMock.setRefreshToken).toHaveBeenCalledWith("new-rt");
  });
});
