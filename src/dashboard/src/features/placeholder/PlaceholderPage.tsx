interface PlaceholderPageProps {
  title: string;
  description: string;
  /** When true, show an explicit Phase 2 notice so the shell is not mistaken for a shipped feature. */
  phase2?: boolean;
}

export function PlaceholderPage({
  title,
  description,
  phase2 = true,
}: PlaceholderPageProps) {
  return (
    <div className="px-8 py-6">
      <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        {description}
      </p>
      {phase2 ? (
        <p
          className="mt-4 max-w-2xl rounded-md border border-ph-border bg-ph-raised/40 px-3 py-2 font-sans text-[12px] text-ph-text-muted"
          role="status"
        >
          <span className="font-medium text-ph-text-secondary">Phase 2</span> —
          not available in this Phase 1 build. Core alias, vault, brokers, inbox,
          and billing routes are live from the sidebar.
        </p>
      ) : null}
    </div>
  );
}
