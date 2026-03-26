import { shouldSkipDevBootstrap } from "@/lib/devBootstrap.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

/**
 * When there is no access token: either bootstrap is still running, or the user
 * signed out (dev skip flag). Avoids flashing “signed out” during first paint.
 */
export function SessionGateMessage() {
  const devBootstrapError = useSessionStore((s) => s.devBootstrapError);

  if (shouldSkipDevBootstrap()) {
    return (
      <div className="px-8 py-6">
        <p className="max-w-md font-sans text-sm leading-relaxed text-ph-text-tertiary">
          You are signed out. Use{" "}
          <span className="font-medium text-ph-text-secondary">
            Resume dev session
          </span>{" "}
          in the top bar to sign in again.
        </p>
      </div>
    );
  }

  if (devBootstrapError) {
    return (
      <div className="px-8 py-6 font-sans text-sm text-ph-danger">
        {devBootstrapError}
      </div>
    );
  }

  return (
    <div className="px-8 py-6 font-sans text-sm text-ph-text-tertiary">
      Connecting session…
    </div>
  );
}
