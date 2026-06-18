import {
  clientErrorFromApiFailure,
  deriveVaultKey,
  exportKeyHex,
} from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout.js";
import { DashboardPage } from "@/features/dashboard/DashboardPage.js";
import { OnboardingModal } from "@/features/onboarding/OnboardingModal.js";
import { LoginPage } from "@/features/auth/LoginPage.js";
import { NotFoundPage } from "@/features/errors/NotFoundPage.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { shouldSkipDevBootstrap } from "@/lib/devBootstrap.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

const BrokersPage = lazy(() =>
  import("@/features/broker/BrokersPage.js").then((m) => ({
    default: m.BrokersPage,
  }))
);
const VaultPage = lazy(() =>
  import("@/features/vault/VaultPage.js").then((m) => ({
    default: m.VaultPage,
  }))
);
const EmailInboxPage = lazy(() =>
  import("@/features/inbox/EmailInboxPage.js").then((m) => ({
    default: m.EmailInboxPage,
  }))
);
const BillingPage = lazy(() =>
  import("@/features/billing/BillingPage.js").then((m) => ({
    default: m.BillingPage,
  }))
);
const DarkWebPage = lazy(() =>
  import("@/features/darkWeb/DarkWebPage.js").then((m) => ({
    default: m.DarkWebPage,
  }))
);
const AliasesPage = lazy(() =>
  import("@/features/aliases/AliasesPage.js").then((m) => ({
    default: m.AliasesPage,
  }))
);
const AliasDetailPage = lazy(() =>
  import("@/features/aliases/AliasDetailPage.js").then((m) => ({
    default: m.AliasDetailPage,
  }))
);
const SettingsPage = lazy(() =>
  import("@/features/settings/SettingsPage.js").then((m) => ({
    default: m.SettingsPage,
  }))
);
const CallGuardPage = lazy(() =>
  import("@/features/callGuard/CallGuardPage.js").then((m) => ({
    default: m.CallGuardPage,
  }))
);
const ScamEngagePage = lazy(() =>
  import("@/features/scamEngage/ScamEngagePage.js").then((m) => ({
    default: m.ScamEngagePage,
  }))
);
const ThreatIntelPage = lazy(() =>
  import("@/features/threatIntel/ThreatIntelPage.js").then((m) => ({
    default: m.ThreatIntelPage,
  }))
);
const ReportsPage = lazy(() =>
  import("@/features/reports/ReportsPage.js").then((m) => ({
    default: m.ReportsPage,
  }))
);
const FamilyPage = lazy(() =>
  import("@/features/family/FamilyPage.js").then((m) => ({
    default: m.FamilyPage,
  }))
);

function SessionBootstrap() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const refreshToken = useSessionStore((s) => s.refreshToken);
  const devBootstrapRetryNonce = useSessionStore(
    (s) => s.devBootstrapRetryNonce
  );
  const setAccessToken = useSessionStore((s) => s.setAccessToken);
  const setRefreshToken = useSessionStore((s) => s.setRefreshToken);
  const setUser = useSessionStore((s) => s.setUser);
  const setDarkWebAlerts = useSessionStore((s) => s.setDarkWebAlerts);
  const setLoginPassword = useSessionStore((s) => s.setLoginPassword);
  const setVaultKeyHex = useSessionStore((s) => s.setVaultKeyHex);
  const setDevBootstrapError = useSessionStore(
    (s) => s.setDevBootstrapError
  );

  useEffect(() => {
    if (shouldSkipDevBootstrap()) {
      setDevBootstrapError(null);
      return;
    }
    let cancelled = false;
    const email =
      import.meta.env.VITE_DEV_EMAIL ?? "dev@phantom.local";
    const password =
      import.meta.env.VITE_DEV_PASSWORD ?? "devpassword123";
    setDevBootstrapError(null);
    void (async () => {
      try {
        const res = await phantomApi.auth.login(email, password);
        if (cancelled) return;
        if (res.ok) {
          setAccessToken(res.data.accessToken);
          setRefreshToken(res.data.refreshToken ?? null);
          setUser(res.data.user);
          setLoginPassword(password);
          setDevBootstrapError(null);

          const saltRes = await phantomApi.vault.getSalt(res.data.accessToken);
          if (cancelled) return;
          if (saltRes.ok && saltRes.data.vaultSalt) {
            const key = await deriveVaultKey(password, saltRes.data.vaultSalt);
            if (!cancelled) setVaultKeyHex(await exportKeyHex(key));
          }
        } else {
          setDevBootstrapError(clientErrorFromApiFailure(res).message);
        }
      } catch {
        if (!cancelled) {
          setDevBootstrapError(
            "Could not reach the API. Is it running (port 8787) and healthy?"
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    devBootstrapRetryNonce,
    setAccessToken,
    setRefreshToken,
    setUser,
    setLoginPassword,
    setVaultKeyHex,
    setDevBootstrapError,
  ]);

  useEffect(() => {
    if (!refreshToken) return;
    const intervalMs = 14 * 60 * 1000;
    const id = window.setInterval(() => {
      void (async () => {
        const rt = useSessionStore.getState().refreshToken;
        if (!rt) return;
        const res = await phantomApi.auth.refresh(rt);
        if (!res.ok) return;
        useSessionStore.getState().setAccessToken(res.data.accessToken);
        useSessionStore.getState().setRefreshToken(res.data.refreshToken);
      })();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [refreshToken]);

  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboardOverview(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.dashboard.overview(accessToken ?? undefined, {
        signal,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.dashboardOverview,
  });

  useEffect(() => {
    if (overviewQuery.data) {
      setDarkWebAlerts(overviewQuery.data.darkWebAlerts);
    }
  }, [overviewQuery.data, setDarkWebAlerts]);

  return null;
}

export function App() {
  return (
    <>
      <SessionBootstrap />
      <OnboardingModal />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/aliases" element={<AliasesPage />} />
          <Route path="/aliases/:id" element={<AliasDetailPage />} />
          <Route path="/inbox" element={<EmailInboxPage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/brokers" element={<BrokersPage />} />
          <Route
            path="/broker-removal"
            element={<Navigate to="/brokers" replace />}
          />
          <Route path="/call-guard" element={<CallGuardPage />} />
          <Route path="/dark-web" element={<DarkWebPage />} />
          <Route path="/scam-engage" element={<ScamEngagePage />} />
          <Route path="/threat-intel" element={<ThreatIntelPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
