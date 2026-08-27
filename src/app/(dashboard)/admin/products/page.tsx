import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { ProductModerationView } from "@/components/admin/product-moderation-view";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPermission("ADMIN_VIEW_PRODUCTS");
  const result = await AdminService.getProductsForModeration({ page: 1, pageSize: 50 });

  return (
    <ProductModerationView
      initialProducts={result.items.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
