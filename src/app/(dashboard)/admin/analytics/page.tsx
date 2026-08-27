import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { PlatformAnalyticsView } from "@/components/admin/platform-analytics-view";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdminPermission("ADMIN_VIEW_ANALYTICS");
  const data = await AdminService.getAnalytics("30d");

  return <PlatformAnalyticsView initialData={data} />;
}
