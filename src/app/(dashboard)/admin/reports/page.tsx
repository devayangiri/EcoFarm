import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { ReportsView } from "@/components/admin/reports-view";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdminPermission("ADMIN_VIEW_REPORTS");
  const result = await AdminService.getReports({ page: 1, pageSize: 50 });

  return (
    <ReportsView
      initialReports={result.items.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
