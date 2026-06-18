import { describe, expect, it } from "vitest";
import { parseBrokerHtml } from "./brokerHtmlParsers.js";

const subject = { searchQuery: "john smith", hasEmail: false };

describe("parseBrokerHtml", () => {
  it("parses spokeo result cards", () => {
    const html =
      '<div class="search-results"><div class="person-card">John Smith age 42</div></div>';
    const result = parseBrokerHtml("spokeo.com", html, subject);
    expect(result?.status).toBe("found");
  });

  it("returns not_found for spokeo empty state", () => {
    const html = "<body>We couldn't find anyone named test</body>";
    const result = parseBrokerHtml("spokeo.com", html, subject);
    expect(result?.status).toBe("not_found");
  });

  it("returns null for unknown domains", () => {
    expect(parseBrokerHtml("unknown-broker.example", "<html></html>", subject)).toBeNull();
  });
});
