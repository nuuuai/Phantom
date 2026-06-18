import { Navigate, useNavigate } from "react-router-dom";
import { SignInForm } from "./SignInForm.js";
import { DASHBOARD_PATHS } from "@/lib/dashboardRoutes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function LoginPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const navigate = useNavigate();

  if (accessToken) {
    return <Navigate to={DASHBOARD_PATHS.home} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ph-bg px-4">
      <div className="w-full max-w-md rounded-xl border border-ph-border bg-ph-surface p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ph-accent to-[#8B5CF6]">
            <div
              className="h-3 w-3 rotate-45 border-2 border-white/90"
              aria-hidden
            />
          </div>
          <span className="text-base font-semibold tracking-[0.2em] text-ph-text-primary">
            PHANTOM
          </span>
        </div>
        <h1 className="mb-1 font-sans text-lg font-semibold text-ph-text-primary">
          Sign in
        </h1>
        <SignInForm onSuccess={() => void navigate(DASHBOARD_PATHS.home)} />
      </div>
    </div>
  );
}
