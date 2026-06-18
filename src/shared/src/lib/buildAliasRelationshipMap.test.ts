import { describe, expect, it } from "vitest";
import { buildAliasRelationshipMap } from "./buildAliasRelationshipMap.js";

describe("buildAliasRelationshipMap", () => {
  it("links aliases on same domain", () => {
    const map = buildAliasRelationshipMap(
      [
        {
          aliasId: "a1",
          label: "Shop email",
          type: "email",
          healthStatus: "healthy",
          serviceUrl: "https://shop.example.com",
          serviceName: "Shop",
        },
        {
          aliasId: "a2",
          label: "Shop user",
          type: "username",
          healthStatus: "warning",
          serviceUrl: "https://www.shop.example.com/login",
          serviceName: "Shop login",
        },
      ],
      2
    );
    expect(map.edges.length).toBe(1);
    expect(map.edges[0]?.kind).toBe("same_domain");
  });
});
