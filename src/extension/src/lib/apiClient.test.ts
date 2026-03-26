import { describe, expect, it, vi } from "vitest";

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
