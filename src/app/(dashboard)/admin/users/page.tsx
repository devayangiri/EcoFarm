import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { UserManagementView } from "@/components/admin/user-management-view";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdminPermission("ADMIN_VIEW_USERS");
  const result = await AdminService.getUsers({ page: 1, pageSize: 50 });

  return (
    <UserManagementView
      initialUsers={result.items.map(u => ({
        ...u,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
      }))}
      currentAdminId={admin.userId}
    />
  );
}
