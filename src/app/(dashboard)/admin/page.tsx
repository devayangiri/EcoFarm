import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdminPermission("ADMIN_VIEW_DASHBOARD");
  const data = await AdminService.getDashboardMetrics(admin.userId);

  return (
    <AdminDashboardView
      metrics={data.metrics}
      recentActivity={data.recentActivity.map(a => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
