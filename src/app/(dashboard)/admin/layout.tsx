import React from "react";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPermission("ADMIN_VIEW_DASHBOARD");

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-surface-lowest">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
