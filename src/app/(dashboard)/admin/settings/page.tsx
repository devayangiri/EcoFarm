import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { AdminSettingsView } from "@/components/admin/admin-settings-view";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminPermission("ADMIN_MANAGE_SETTINGS");
  const settings = await AdminService.getAdminSettings();

  return <AdminSettingsView initialSettings={settings} />;
}
