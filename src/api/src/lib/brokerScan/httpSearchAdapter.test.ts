import { describe, expect, it } from "vitest";
import { analyzeHtmlForExposure } from "./httpSearchAdapter.js";

describe("analyzeHtmlForExposure", () => {
  it("detects found when result signals present", () => {
    const html =
      "<html><body><h1>Search results</h1><p>3 records found for john smith</p></body></html>";
    const result = analyzeHtmlForExposure(html, {
      searchQuery: "john smith",
      hasEmail: true,
    });
    expect(result.status).toBe("found");
    expect(result.dataTypesFound.length).toBeGreaterThan(0);
  });

  it("returns not_found for empty pages", () => {
    const result = analyzeHtmlForExposure("<html><body>blocked</body></html>", {
      searchQuery: "test user",
      hasEmail: false,
    });
    expect(result.status).toBe("not_found");
  });
});
