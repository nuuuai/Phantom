/** Enables React 18 act() without spurious warnings in Vitest/jsdom. */
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
