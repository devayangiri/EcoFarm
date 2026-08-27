import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { DisputesView } from "@/components/admin/disputes-view";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  await requireAdminPermission("ADMIN_VIEW_DISPUTES");
  const result = await AdminService.getDisputes({ page: 1, pageSize: 50 });

  return (
    <DisputesView
      initialDisputes={result.items.map(d => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
