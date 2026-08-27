import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { ReviewsView } from "@/components/admin/reviews-view";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireAdminPermission("ADMIN_VIEW_REVIEWS");
  const result = await AdminService.getReviews({ page: 1, pageSize: 50 });

  return (
    <ReviewsView
      initialReviews={result.items.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
