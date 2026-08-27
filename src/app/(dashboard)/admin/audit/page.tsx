import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireAdminPermission("ADMIN_VIEW_AUDIT_LOGS");
  const result = await AdminService.getAuditLogs({ page: 1, pageSize: 50 });

  return (
    <AuditLogViewer
      initialLogs={result.items.map(l => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  );
}
