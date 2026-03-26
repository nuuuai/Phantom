/**
 * Debug logging for extension internals. No-ops in production builds
 * (`process.env.NODE_ENV === "production"`).
 */
export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "production") return;
  console.debug("[phantom-ext]", ...args);
}
