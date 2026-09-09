"use client";

import React, { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { Footer } from "./footer";
import { FloatingAIButton } from "@/components/ai/floating-ai-button";

export const ShellContext = createContext<boolean>(false);

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
  currentPath,
  hideFooter,
}: AppShellProps) {
  const isInsideShell = useContext(ShellContext);
  const pathname = usePathname();

  // Defensive Guardrail: If already wrapped in an outer AppShell (e.g. via RoleDashboardLayout),
  // return children directly to avoid duplicate shells, headers, sidebars, or layout breakage.
  if (isInsideShell) {
    return <>{children}</>;
  }

  const effectivePath = currentPath || pathname || "/";

  // Determine if this is an internal dashboard view where a marketing footer would create clutter
  const isDashboardRoute =
    showSidebar ||
    effectivePath.startsWith("/farmer") ||
    effectivePath.startsWith("/buyer") ||
    effectivePath.startsWith("/provider") ||
    effectivePath.startsWith("/agent") ||
    effectivePath.startsWith("/admin") ||
    effectivePath.startsWith("/settings");

  const shouldHideFooter =
    hideFooter !== undefined ? hideFooter : isDashboardRoute;

  return (
    <ShellContext.Provider value={true}>
      <div className="min-h-[100dvh] bg-surface flex flex-col font-body text-on-surface selection:bg-brand-primary/10 selection:text-brand-primary">
        {/* Desktop Header */}
        <Header
          userRole={userRole}
          userName={userName}
          currentPath={effectivePath}
        />

        {/* Mobile Top Header */}
        <MobileHeader userRole={userRole} userName={userName} />

        {/* Main App Body */}
        <div className="flex-1 flex flex-col w-full">
          <div className="flex-1 flex w-full">
            {/* Desktop Sidebar (Dashboard Views) */}
            {showSidebar && (
              <Sidebar userRole={userRole} currentPath={effectivePath} />
            )}

            {/* Content Viewport with mobile bottom navigation offset */}
            <main className="flex-1 w-full pb-20 md:pb-8">{children}</main>
          </div>

          {/* Global Professional Footer on Public Pages */}
          {!shouldHideFooter && <Footer />}
        </div>

        {/* Mobile Bottom Navigation (Smart Role-Aware) */}
        <MobileBottomNav currentPath={effectivePath} userRole={userRole} />

        {/* Global Floating AI Trigger */}
        <FloatingAIButton />
      </div>
    </ShellContext.Provider>
  );
}
