const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
] as const;

/** Comma-separated `CORS_ORIGIN` overrides the default dashboard dev origins. */
export function resolveCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return [...DEFAULT_ORIGINS];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
