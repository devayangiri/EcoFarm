import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleDashboardPath } from "@/lib/rbac";
import { RoleDashboardLayout } from "@/components/layout/role-dashboard-layout";

export const dynamic = "force-dynamic";

export default async function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/farmer");
  }

  if (session.role !== "FARMER" && session.role !== "ADMIN") {
    redirect(getRoleDashboardPath(session.role));
  }

  return (
    <RoleDashboardLayout
      userRole={session.role === "ADMIN" ? "FARMER" : session.role}
      userName={session.fullName || "Farmer"}
    >
      {children}
    </RoleDashboardLayout>
  );
}
