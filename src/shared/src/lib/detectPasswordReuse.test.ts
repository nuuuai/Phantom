import { describe, expect, it } from "vitest";
import { detectPasswordReuse } from "./detectPasswordReuse.js";

describe("detectPasswordReuse", () => {
  it("groups entries with identical passwords", () => {
    const groups = detectPasswordReuse([
      { id: "a", label: "Site A", password: "same-secret" },
      { id: "b", label: "Site B", password: "same-secret" },
      { id: "c", label: "Site C", password: "unique" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.entryIds).toEqual(["a", "b"]);
  });

  it("returns empty when no reuse", () => {
    const groups = detectPasswordReuse([
      { id: "a", label: "A", password: "one" },
      { id: "b", label: "B", password: "two" },
    ]);
    expect(groups).toHaveLength(0);
  });
});
