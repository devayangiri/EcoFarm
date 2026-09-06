import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleDashboardPath } from "@/lib/rbac";
import { RoleDashboardLayout } from "@/components/layout/role-dashboard-layout";

export const dynamic = "force-dynamic";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/agent");
  }

  if (session.role !== "AGENT" && session.role !== "ADMIN") {
    redirect(getRoleDashboardPath(session.role));
  }

  return (
    <RoleDashboardLayout
      userRole={session.role === "ADMIN" ? "AGENT" : session.role}
      userName={session.fullName || "Field Agent"}
    >
      {children}
    </RoleDashboardLayout>
  );
}
