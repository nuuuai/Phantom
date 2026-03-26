import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NotificationCenter } from "@/features/notifications/NotificationCenter.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import {
  clearSkipDevBootstrap,
  setSkipDevBootstrap,
  shouldSkipDevBootstrap,
} from "@/lib/devBootstrap.js";
import { queryClient } from "@/lib/queryClient.js";
import { titleForPath } from "@/lib/routeTitles.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const devBootstrapError = useSessionStore((s) => s.devBootstrapError);
  const incrementDevBootstrapRetry = useSessionStore(
    (s) => s.incrementDevBootstrapRetry
  );
  const clearSession = useSessionStore((s) => s.clearSession);
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    const rt = useSessionStore.getState().refreshToken;
    if (rt) {
      try {
        await phantomApi.auth.logout(rt);
      } catch {
        /* still clear local session */
      }
    }
    setSkipDevBootstrap();
    queryClient.clear();
    clearSession();
    setSigningOut(false);
    void navigate("/", { replace: true });
  }, [clearSession, navigate, signingOut]);

  const onResumeDevSession = useCallback(() => {
    clearSkipDevBootstrap();
    window.location.reload();
  }, []);

  const title = useMemo(
    () => titleForPath(location.pathname),
    [location.pathname]
  );

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-ph-border bg-ph-topbar px-4 py-4 sm:px-8">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
        <span className="truncate text-lg font-semibold text-ph-text-primary">
          {title}
        </span>
        <span className="hidden font-mono text-xs text-ph-text-tertiary sm:inline">
          {dateLabel}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <NotificationCenter />
        {accessToken ? (
          <button
            type="button"
            onClick={() => void onSignOut()}
            disabled={signingOut}
            className="cursor-pointer rounded-md border border-ph-border bg-ph-bg px-3.5 py-1.5 font-sans text-xs text-ph-text-tertiary hover:text-ph-text-secondary disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        ) : shouldSkipDevBootstrap() ? (
          <button
            type="button"
            onClick={onResumeDevSession}
            className="cursor-pointer rounded-md border border-ph-accent-border bg-[#6C3AED15] px-3.5 py-1.5 font-sans text-xs font-medium text-ph-accent-light"
          >
            Resume dev session
          </button>
        ) : devBootstrapError ? (
          <div className="flex max-w-[min(420px,50vw)] items-center gap-2">
            <span
              className="truncate font-sans text-xs text-ph-danger"
              title={devBootstrapError}
            >
              {devBootstrapError}
            </span>
            <button
              type="button"
              onClick={() => incrementDevBootstrapRetry()}
              className="shrink-0 cursor-pointer rounded-md border border-ph-border bg-ph-bg px-2.5 py-1 font-sans text-xs text-ph-text-secondary hover:text-ph-text-primary"
            >
              Retry
            </button>
          </div>
        ) : (
          <span className="font-mono text-[10px] text-ph-text-muted">
            Connecting…
          </span>
        )}
        <button
          type="button"
          className="cursor-pointer rounded-md border border-[#2a2a34] bg-ph-raised px-3.5 py-1.5 font-sans text-xs text-ph-text-secondary"
        >
          This month ▾
        </button>
        <button
          type="button"
          onClick={() => navigate("/aliases")}
          className="cursor-pointer rounded-md border border-ph-accent-border bg-[#6C3AED15] px-3.5 py-1.5 font-sans text-xs font-medium text-ph-accent-light"
        >
          + Generate alias
        </button>
      </div>
    </div>
  );
}
