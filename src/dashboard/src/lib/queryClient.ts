import { QueryClient } from "@tanstack/react-query";
import { QUERY_GC_TIME_MS } from "./queryStaleTimes.js";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: QUERY_GC_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
