import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdminPermission("ADMIN_VIEW_DASHBOARD");
  let data = {
    metrics: { totalUsers: 0, pendingVerifications: 0, activeListings: 0, openDisputes: 0, activeServices: 0, systemHealth: "HEALTHY" },
    recentActivity: [] as any[],
  };

  try {
    data = await AdminService.getDashboardMetrics(admin.userId) as any;
  } catch (err) {
    console.warn("Admin dashboard database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <AdminDashboardView
      metrics={data.metrics as any}
      recentActivity={(data.recentActivity || []).map(a => ({
        ...a,
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : (a.createdAt || new Date().toISOString()),
      }))}
    />
  );
}
