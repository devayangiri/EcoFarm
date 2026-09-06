import React from "react";
import { AppShell } from "./app-shell";

export interface RoleDashboardLayoutProps {
  children: React.ReactNode;
  userRole: string;
  userName?: string;
  currentPath?: string;
}

/**
 * RoleDashboardLayout
 *
 * Unified layout wrapper for role-specific workspaces (Agent, Buyer, Provider, Farmer).
 * Ensures that all routes under a role consistently render with:
 * 1. Global Header
 * 2. Role-specific Sidebar
 * 3. Main content area
 * 4. Suppressed public marketing footer
 */
export function RoleDashboardLayout({
  children,
  userRole,
  userName = "Welcome",
  currentPath,
}: RoleDashboardLayoutProps) {
  return (
    <AppShell
      showSidebar={true}
      userRole={userRole}
      userName={userName}
      currentPath={currentPath}
      hideFooter={true}
    >
      {children}
    </AppShell>
  );
}
