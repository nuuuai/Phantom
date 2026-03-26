import { describe, expect, it } from "vitest";
import { queryClient } from "./queryClient";

describe("queryClient", () => {
  it("is configured", () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
  });
});
