import React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { Footer } from "./footer";

export interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  userRole?: string;
  userName?: string;
  currentPath?: string;
  hideFooter?: boolean;
}

export function AppShell({
  children,
  showSidebar = false,
  userRole = "Guest",
  userName = "Welcome",
  currentPath = "/",
  hideFooter,
}: AppShellProps) {
  // Determine if this is an internal dashboard view where a marketing footer would create clutter
  const isDashboardRoute =
    showSidebar ||
    currentPath.startsWith("/farmer") ||
    currentPath.startsWith("/buyer") ||
    currentPath.startsWith("/provider") ||
    currentPath.startsWith("/agent") ||
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/settings");

  const shouldHideFooter =
    hideFooter !== undefined ? hideFooter : isDashboardRoute;

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-body text-on-surface selection:bg-brand-primary/10 selection:text-brand-primary">
      {/* Desktop Header */}
      <Header
        userRole={userRole}
        userName={userName}
        currentPath={currentPath}
      />

      {/* Mobile Top Header */}
      <MobileHeader userRole={userRole} userName={userName} />

      {/* Main App Body */}
      <div className="flex-1 flex flex-col w-full">
        <div className="flex-1 flex w-full">
          {/* Desktop Sidebar (Dashboard Views) */}
          {showSidebar && (
            <Sidebar userRole={userRole} currentPath={currentPath} />
          )}

          {/* Content Viewport with mobile bottom navigation offset */}
          <main className="flex-1 w-full pb-20 md:pb-8">{children}</main>
        </div>

        {/* Global Professional Footer on Public Pages */}
        {!shouldHideFooter && <Footer />}
      </div>

      {/* Mobile Bottom Navigation (Smart Role-Aware) */}
      <MobileBottomNav currentPath={currentPath} userRole={userRole} />
    </div>
  );
}
