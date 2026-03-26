import { describe, expect, it } from "vitest";
import { queryClient } from "./queryClient.js";
import { QUERY_GC_TIME_MS } from "./queryStaleTimes.js";

describe("queryClient", () => {
  it("is configured", () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
    expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(
      QUERY_GC_TIME_MS
    );
  });
});
