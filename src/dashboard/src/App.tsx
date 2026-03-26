import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout.js";
import { AliasesPage } from "@/features/aliases/AliasesPage.js";
import { BrokerRemovalPage } from "@/features/broker/BrokerRemovalPage.js";
import { DashboardPage } from "@/features/dashboard/DashboardPage.js";
import { PlaceholderPage } from "@/features/placeholder/PlaceholderPage.js";
import { SettingsPage } from "@/features/settings/SettingsPage.js";
import { VaultPage } from "@/features/vault/VaultPage.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

function SessionBootstrap() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const setAccessToken = useSessionStore((s) => s.setAccessToken);
  const setUser = useSessionStore((s) => s.setUser);
  const setDarkWebAlerts = useSessionStore((s) => s.setDarkWebAlerts);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await phantomApi.auth.login();
      if (cancelled) return;
      if (res.ok) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAccessToken, setUser]);

  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboardOverview(accessToken),
    queryFn: async () => {
      const res = await phantomApi.dashboard.overview(accessToken ?? undefined);
      if (!res.ok) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
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
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/aliases" element={<AliasesPage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/broker-removal" element={<BrokerRemovalPage />} />
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
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
