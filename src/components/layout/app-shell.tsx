import React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";

export interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  userRole?: string;
  userName?: string;
  currentPath?: string;
}

export function AppShell({
  children,
  showSidebar = false,
  userRole = "FARMER",
  userName = "Member",
  currentPath = "/",
}: AppShellProps) {
  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-body text-on-surface">
      {/* Desktop Header */}
      <Header userRole={userRole} userName={userName} />

      {/* Mobile Top Header */}
      <MobileHeader />

      {/* Main App Body */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar (Optional based on view) */}
        {showSidebar && <Sidebar userRole={userRole} currentPath={currentPath} />}

        {/* Content Viewport with mobile bottom navigation offset */}
        <main className="flex-1 w-full pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Android/iOS Mobile Bottom Navigation */}
      <MobileBottomNav currentPath={currentPath} userRole={userRole} />
    </div>
  );
}
