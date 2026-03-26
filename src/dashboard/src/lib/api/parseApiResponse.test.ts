import { describe, expect, it } from "vitest";
import { parseApiResponseJson } from "./parseApiResponse.js";

describe("parseApiResponseJson", () => {
  it("returns body on 2xx", async () => {
    const res = new Response(JSON.stringify({ ok: true, data: { n: 1 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const out = await parseApiResponseJson<{ n: number }>(res);
    expect(out).toEqual({ ok: true, data: { n: 1 } });
  });

  it("preserves API error payload on non-2xx when ok is false", async () => {
    const res = new Response(
      JSON.stringify({
        ok: false,
        error: { code: "validation_error", message: "bad" },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
    const out = await parseApiResponseJson<unknown>(res);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error.code).toBe("validation_error");
    }
  });

  it("falls back to http_error when response is not ok and body has no ok:false", async () => {
    const res = new Response(JSON.stringify({}), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
    const out = await parseApiResponseJson<unknown>(res);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error.code).toBe("http_error");
      expect(out.error.message).toContain("502");
    }
  });

  it("returns invalid_response for empty body", async () => {
    const res = new Response("", {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    const out = await parseApiResponseJson<unknown>(res);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error.code).toBe("invalid_response");
      expect(out.error.message).toContain("empty");
    }
  });

  it("returns invalid_response when content-type is not JSON", async () => {
    const res = new Response("<html></html>", {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
    const out = await parseApiResponseJson<unknown>(res);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error.code).toBe("invalid_response");
      expect(out.error.message).toContain("text/html");
    }
  });

  it("returns invalid_response for malformed JSON with JSON content-type", async () => {
    const res = new Response("{ not json", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const out = await parseApiResponseJson<unknown>(res);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error.code).toBe("invalid_response");
    }
  });
});
