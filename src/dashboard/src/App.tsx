import {
  clientErrorFromApiFailure,
  deriveVaultKey,
  exportKeyHex,
} from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout.js";
import { AliasDetailPage } from "@/features/aliases/AliasDetailPage.js";
import { AliasesPage } from "@/features/aliases/AliasesPage.js";
import { BrokersPage } from "@/features/broker/BrokersPage.js";
import { DashboardPage } from "@/features/dashboard/DashboardPage.js";
import { OnboardingModal } from "@/features/onboarding/OnboardingModal.js";
import { PlaceholderPage } from "@/features/placeholder/PlaceholderPage.js";
import { SettingsPage } from "@/features/settings/SettingsPage.js";
import { BillingPage } from "@/features/billing/BillingPage.js";
import { EmailInboxPage } from "@/features/inbox/EmailInboxPage.js";
import { VaultPage } from "@/features/vault/VaultPage.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { shouldSkipDevBootstrap } from "@/lib/devBootstrap.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

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
    queryFn: async () => {
      const res = await phantomApi.dashboard.overview(accessToken ?? undefined);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
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
          <Route
            path="/call-guard"
            element={
              <PlaceholderPage
                title="Call Guard"
                description="Call screening and telephony posture. Phase 1 wiring connects here."
              />
            }
          />
          <Route
            path="/dark-web"
            element={
              <PlaceholderPage
                title="Dark web"
                description="Dark web monitoring alerts and triage. No raw breach data in the UI."
              />
            }
          />
          <Route
            path="/scam-engage"
            element={
              <PlaceholderPage
                title="Scam engage"
                description="Scammer Engagement Engine transcripts and controls."
              />
            }
          />
          <Route
            path="/threat-intel"
            element={
              <PlaceholderPage
                title="Threat intel"
                description="Anonymized campaign intelligence from the Brain."
              />
            }
          />
          <Route
            path="/reports"
            element={
              <PlaceholderPage
                title="Reports"
                description="Exposure and removal reporting."
              />
            }
          />
          <Route
            path="/family"
            element={
              <PlaceholderPage
                title="Family"
                description="Family command center (Phase 1 shell)."
              />
            }
          />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
