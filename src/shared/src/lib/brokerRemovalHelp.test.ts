import { describe, expect, it } from "vitest";
import type { DataBroker } from "../types/brokerScan.js";
import {
  brokerRemovalLinkLabel,
  brokerRemovalMethodLabel,
  brokerRemovalSearchUrl,
  resolveBrokerRemovalHref,
} from "./brokerRemovalHelp.js";

function broker(partial: Partial<DataBroker>): DataBroker {
  return {
    id: "b1",
    name: "Test Broker",
    domain: "example.com",
    category: "people_search",
    removalMethod: "form",
    avgRemovalDays: 14,
    removalUrl: null,
    removalNotes: null,
    isActive: true,
    ...partial,
  };
}

describe("brokerRemovalHelp", () => {
  it("resolveBrokerRemovalHref uses catalog URL when set", () => {
    const href = resolveBrokerRemovalHref(
      broker({ removalUrl: "https://example.com/optout" })
    );
    expect(href).toBe("https://example.com/optout");
  });

  it("resolveBrokerRemovalHref falls back to search when URL missing", () => {
    const href = resolveBrokerRemovalHref(broker({ name: "Acme Data" }));
    expect(href).toContain("duckduckgo.com");
    expect(href).toContain(encodeURIComponent("Acme Data"));
  });

  it("brokerRemovalSearchUrl encodes the query", () => {
    expect(brokerRemovalSearchUrl("Foo & Bar")).toContain(
      encodeURIComponent("Foo & Bar")
    );
  });

  it("brokerRemovalMethodLabel maps catalog methods", () => {
    expect(brokerRemovalMethodLabel("api")).toContain("API");
    expect(brokerRemovalMethodLabel("form")).toContain("DIY");
    expect(brokerRemovalMethodLabel("email")).toContain("Email");
    expect(brokerRemovalMethodLabel("manual")).toContain("Manual");
  });

  it("brokerRemovalLinkLabel reflects URL presence", () => {
    expect(brokerRemovalLinkLabel(broker({ removalUrl: "https://x.com/o" }))).toBe(
      "Open removal page"
    );
    expect(brokerRemovalLinkLabel(broker({ removalUrl: null }))).toBe(
      "Search opt-out help"
    );
  });
});
