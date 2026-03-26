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

  it("returns invalid_response for empty body", async () => {
    const res = new Response("", {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    const out = await parseApiResponseJson<unknown>(res);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.code).toBe("invalid_response");
  });

  it("returns invalid_response for non-JSON content-type", async () => {
    const res = new Response("<html></html>", {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
    const out = await parseApiResponseJson<unknown>(res);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.code).toBe("invalid_response");
  });

  it("preserves ok:false from API on non-2xx", async () => {
    const res = new Response(
      JSON.stringify({
        ok: false,
        error: { code: "server_error", message: "bad" },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    const out = await parseApiResponseJson<unknown>(res);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.message).toBe("bad");
  });
});
