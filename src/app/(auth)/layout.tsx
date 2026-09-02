import React from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell currentPath="/login" userRole="Guest">
      <div className="py-4 sm:py-8 min-h-[calc(100vh-16rem)] flex items-center justify-center">
        {children}
      </div>
    </AppShell>
  );
}
