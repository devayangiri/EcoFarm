import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { VerificationOversightView } from "@/components/admin/verification-oversight-view";

export const dynamic = "force-dynamic";

export default async function AdminVerificationPage() {
  await requireAdminPermission("ADMIN_VIEW_VERIFICATIONS");
  const result = await AdminService.getVerificationOverview({ page: 1, pageSize: 50 });

  return (
    <VerificationOversightView
      initialRequests={result.items.map(r => ({
        ...r,
        submittedAt: r.submittedAt.toISOString(),
      }))}
    />
  );
}
