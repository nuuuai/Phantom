import { describe, expect, it } from "vitest";
import { inferCopilotGenerateAlias } from "./inferCopilotGenerateAlias.js";

describe("inferCopilotGenerateAlias", () => {
  it("parses shopping alias for a service", () => {
    const params = inferCopilotGenerateAlias(
      "Create a shopping alias for Amazon"
    );
    expect(params?.type).toBe("email");
    expect(params?.category).toBe("shopping");
    expect(params?.serviceName).toBe("amazon");
  });

  it("returns null when not an alias request", () => {
    expect(inferCopilotGenerateAlias("What is my risk score?")).toBeNull();
  });
});
