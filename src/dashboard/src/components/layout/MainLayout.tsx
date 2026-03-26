import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { FeatureRouteErrorBoundary } from "./FeatureRouteErrorBoundary.js";
import { RouteFallback } from "./RouteFallback.js";
import { MobileNavBar } from "./MobileNavBar.js";
import { SidebarNav } from "./SidebarNav.js";
import { TopBar } from "./TopBar.js";

export function MainLayout() {
  return (
    <div className="flex min-h-screen bg-ph-bg">
      <a
        href="#main-content"
        className="absolute left-[-9999px] top-4 z-[100] rounded-md border border-ph-accent-border bg-ph-surface px-4 py-2 font-sans text-sm text-ph-accent-light focus:left-4 focus:outline-none focus:ring-2 focus:ring-ph-accent/50"
      >
        Skip to main content
      </a>
      <SidebarNav />
      <div className="flex max-h-screen min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <MobileNavBar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ph-accent/30"
        >
          <Suspense fallback={<RouteFallback />}>
            <FeatureRouteErrorBoundary>
              <Outlet />
            </FeatureRouteErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
