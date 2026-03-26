/** Skeleton shown while lazy route chunks load (matches main content padding). */
export function RouteFallback() {
  return (
    <div className="animate-pulse px-8 py-6">
      <div className="h-7 w-48 rounded bg-ph-border" />
      <div className="mt-3 h-4 w-full max-w-xl rounded bg-ph-border/60" />
      <div className="mt-8 h-40 rounded-xl border border-ph-border bg-ph-surface" />
    </div>
  );
}
