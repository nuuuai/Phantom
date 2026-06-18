import { describe, expect, it } from "vitest";
import { pickAliasForSite } from "./pickAliasForSite.js";

describe("pickAliasForSite", () => {
  it("prefers alias with matching service URL", () => {
    const match = pickAliasForSite(
      "amazon.com",
      [
        {
          id: "a1",
          type: "email",
          category: "shopping",
          serviceUrl: "https://amazon.com",
          serviceName: "Amazon",
          value: "shop@alias.test",
          isActive: true,
          healthStatus: "healthy",
        },
        {
          id: "a2",
          type: "email",
          category: "social",
          serviceUrl: "https://twitter.com",
          serviceName: "Twitter",
          value: "social@alias.test",
          isActive: true,
          healthStatus: "healthy",
        },
      ],
      "email"
    );
    expect(match?.id).toBe("a1");
  });

  it("returns null when no strong match", () => {
    expect(
      pickAliasForSite(
        "unknown-site.example",
        [
        {
          id: "a1",
          type: "email",
          category: "shopping",
          serviceUrl: null,
          serviceName: null,
          value: "x@alias.test",
          isActive: true,
          healthStatus: "healthy",
        },
        ],
        "email"
      )
    ).toBeNull();
  });
});
