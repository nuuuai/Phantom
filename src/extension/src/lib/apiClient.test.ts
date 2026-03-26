import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storageMock = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
}));

vi.mock("./storage.js", () => ({
  getAccessToken: () => storageMock.getAccessToken(),
  getRefreshToken: () => storageMock.getRefreshToken(),
  setAccessToken: (t: string | null) => storageMock.setAccessToken(t),
  setRefreshToken: (t: string | null) => storageMock.setRefreshToken(t),
}));

function stubChromeStorage(getImpl: () => Promise<Record<string, unknown>>) {
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(getImpl),
      },
    },
  });
}

describe("validateApiBaseUrlInput", () => {
  it("rejects empty string", async () => {
    const { validateApiBaseUrlInput } = await import("./apiClient.js");
    const r = validateApiBaseUrlInput("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });

  it("accepts https origin without path", async () => {
    const { validateApiBaseUrlInput } = await import("./apiClient.js");
    const r = validateApiBaseUrlInput("https://api.example.com");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe("https://api.example.com");
  });

  it("preserves path prefix when present", async () => {
    const { validateApiBaseUrlInput } = await import("./apiClient.js");
    const r = validateApiBaseUrlInput("https://api.example.com/v1/");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe("https://api.example.com/v1");
  });

  it("rejects non-http(s) protocols", async () => {
    const { validateApiBaseUrlInput } = await import("./apiClient.js");
    const r = validateApiBaseUrlInput("javascript:alert(1)");
    expect(r.ok).toBe(false);
  });
});

describe("getApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to localhost:8787 without trailing slash", async () => {
    stubChromeStorage(async () => ({}));
    vi.resetModules();
    const prev = process.env.PLASMO_PUBLIC_API_URL;
    delete process.env.PLASMO_PUBLIC_API_URL;
    const { getApiBaseUrl } = await import("./apiClient.js");
    await expect(getApiBaseUrl()).resolves.toBe("http://localhost:8787");
    process.env.PLASMO_PUBLIC_API_URL = prev;
  });

  it("strips trailing slash from PLASMO_PUBLIC_API_URL", async () => {
    stubChromeStorage(async () => ({}));
    vi.resetModules();
    const prev = process.env.PLASMO_PUBLIC_API_URL;
    process.env.PLASMO_PUBLIC_API_URL = "http://localhost:9999/";
    const { getApiBaseUrl } = await import("./apiClient.js");
    await expect(getApiBaseUrl()).resolves.toBe("http://localhost:9999");
    process.env.PLASMO_PUBLIC_API_URL = prev;
  });

  it("uses chrome.storage override when valid", async () => {
    stubChromeStorage(async () => ({
      phantom_api_base_url: "https://staging.example.com",
    }));
    vi.resetModules();
    const prev = process.env.PLASMO_PUBLIC_API_URL;
    process.env.PLASMO_PUBLIC_API_URL = "http://localhost:9999";
    try {
      const { getApiBaseUrl } = await import("./apiClient.js");
      await expect(getApiBaseUrl()).resolves.toBe("https://staging.example.com");
    } finally {
      process.env.PLASMO_PUBLIC_API_URL = prev;
    }
  });

  it("falls back to build default when storage override is invalid", async () => {
    stubChromeStorage(async () => ({
      phantom_api_base_url: "not-a-url",
    }));
    vi.resetModules();
    const prev = process.env.PLASMO_PUBLIC_API_URL;
    process.env.PLASMO_PUBLIC_API_URL = "http://localhost:8888";
    try {
      const { getApiBaseUrl } = await import("./apiClient.js");
      await expect(getApiBaseUrl()).resolves.toBe("http://localhost:8888");
    } finally {
      process.env.PLASMO_PUBLIC_API_URL = prev;
    }
  });
});

describe("refreshSession", () => {
  beforeEach(() => {
    stubChromeStorage(async () => ({}));
  });

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

  it("retries once after 503 then succeeds", async () => {
    storageMock.getRefreshToken.mockResolvedValue("rt");
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("", { status: 503, headers: { "Content-Type": "application/json" } })
      )
      .mockResolvedValueOnce(
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
      );
    vi.stubGlobal("fetch", fetchMock);
    const { refreshSession } = await import("./apiClient.js");
    const p = refreshSession();
    await vi.advanceTimersByTimeAsync(500);
    await expect(p).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
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

  it("returns false when fetch throws (offline)", async () => {
    storageMock.getRefreshToken.mockResolvedValue("rt");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline")))
    );
    const { refreshSession } = await import("./apiClient.js");
    await expect(refreshSession()).resolves.toBe(false);
  });
});

describe("fetchAuth", () => {
  beforeEach(() => {
    stubChromeStorage(async () => ({}));
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns 503 JSON when fetch throws", async () => {
    storageMock.getAccessToken.mockResolvedValue("at");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline")))
    );
    const { fetchAuth } = await import("./apiClient.js");
    const res = await fetchAuth("/api/aliases/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(503);
    const json = (await res.json()) as {
      ok: boolean;
      error: { code: string };
    };
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("network_error");
  });

  it("passes through API 503 body (not synthetic network_error)", async () => {
    storageMock.getAccessToken.mockResolvedValue("at");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: { code: "overloaded", message: "Try later" },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    const { fetchAuth } = await import("./apiClient.js");
    const res = await fetchAuth("/api/vault/sync");
    expect(res.status).toBe(503);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("overloaded");
  });

  it("returns 401 when refresh after 401 fails", async () => {
    storageMock.getAccessToken.mockResolvedValue("at");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: false,
            error: { code: "unauthorized", message: "expired" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response("", { status: 401, headers: { "Content-Type": "application/json" } })
      );
    vi.stubGlobal("fetch", fetchMock);
    storageMock.getRefreshToken.mockResolvedValue("rt");
    const { fetchAuth } = await import("./apiClient.js");
    const res = await fetchAuth("/api/aliases");
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns synthetic 401 JSON when not signed in", async () => {
    storageMock.getAccessToken.mockResolvedValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAuth } = await import("./apiClient.js");
    const res = await fetchAuth("/api/aliases");
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("unauthorized");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries once after 429 then returns success", async () => {
    storageMock.getAccessToken.mockResolvedValue("at");
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: false, error: { code: "rate_limited" } }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, data: { x: 1 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAuth } = await import("./apiClient.js");
    const p = fetchAuth("/api/aliases/generate", { method: "POST" });
    await vi.advanceTimersByTimeAsync(1600);
    const res = await p;
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("401 then successful refresh then retries request", async () => {
    let access = "at1";
    storageMock.getAccessToken.mockImplementation(() => Promise.resolve(access));
    storageMock.setAccessToken.mockImplementation((t: string | null) => {
      access = t ?? "";
    });
    storageMock.getRefreshToken.mockResolvedValue("rt");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: false,
            error: { code: "unauthorized", message: "expired" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            data: { accessToken: "at2", refreshToken: "rt2" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, data: { items: [] } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAuth } = await import("./apiClient.js");
    const res = await fetchAuth("/api/aliases");
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
