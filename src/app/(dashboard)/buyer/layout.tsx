import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleDashboardPath } from "@/lib/rbac";
import { RoleDashboardLayout } from "@/components/layout/role-dashboard-layout";

export const dynamic = "force-dynamic";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/buyer");
  }

  if (session.role !== "BUYER" && session.role !== "ADMIN") {
    redirect(getRoleDashboardPath(session.role));
  }

  return (
    <RoleDashboardLayout
      userRole={session.role === "ADMIN" ? "BUYER" : session.role}
      userName={session.fullName || "Buyer"}
    >
      {children}
    </RoleDashboardLayout>
  );
}
