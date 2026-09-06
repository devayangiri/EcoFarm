import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleDashboardPath } from "@/lib/rbac";
import { RoleDashboardLayout } from "@/components/layout/role-dashboard-layout";

export const dynamic = "force-dynamic";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/provider");
  }

  if (session.role !== "SERVICE_PROVIDER" && session.role !== "ADMIN") {
    redirect(getRoleDashboardPath(session.role));
  }

  return (
    <RoleDashboardLayout
      userRole={session.role === "ADMIN" ? "SERVICE_PROVIDER" : session.role}
      userName={session.fullName || "Service Provider"}
    >
      {children}
    </RoleDashboardLayout>
  );
}
