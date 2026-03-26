import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { hasError: boolean; message: string | null };

/**
 * Catches render errors in lazy-loaded routes (e.g. failed chunk fetch) so the
 * shell stays visible instead of a blank main pane.
 */
export class FeatureRouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(err: unknown): State {
    const message =
      err instanceof Error ? err.message : "This section failed to load.";
    return { hasError: true, message };
  }

  componentDidCatch(err: unknown, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[FeatureRouteErrorBoundary]", err, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="px-4 py-8 sm:px-8">
          <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-lg font-sans text-sm text-ph-text-tertiary">
            {this.state.message ?? "Try reloading this page or return home."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-md border border-ph-border bg-ph-raised px-4 py-2 font-sans text-xs text-ph-text-secondary hover:bg-ph-border/40"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
            <button
              type="button"
              className="rounded-md bg-ph-accent px-4 py-2 font-sans text-xs font-medium text-white hover:opacity-90"
              onClick={() => {
                this.setState({ hasError: false, message: null });
                window.location.assign("/");
              }}
            >
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
