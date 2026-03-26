import { Outlet } from "react-router-dom";
import { SidebarNav } from "./SidebarNav.js";
import { TopBar } from "./TopBar.js";

export function MainLayout() {
  return (
    <div className="flex min-h-screen bg-ph-bg">
      <SidebarNav />
      <div className="flex max-h-screen min-h-screen flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
