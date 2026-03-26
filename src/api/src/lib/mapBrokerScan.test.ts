import type { DataBroker as PrismaBroker } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { mapBroker } from "./mapBrokerScan.js";

describe("mapBrokerScan", () => {
  it("mapBroker includes removalUrl and removalNotes", () => {
    const row: PrismaBroker = {
      id: "bid",
      name: "Spokeo",
      domain: "spokeo.com",
      category: "people_search",
      removalMethod: "form",
      avgRemovalDays: 14,
      removalUrl: "https://www.spokeo.com/optout",
      removalNotes: null,
      isActive: true,
    };
    const m = mapBroker(row);
    expect(m.removalUrl).toBe("https://www.spokeo.com/optout");
    expect(m.removalNotes).toBeNull();
  });
});
