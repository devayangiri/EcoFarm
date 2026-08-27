import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { OrderSupervisionView } from "@/components/admin/order-supervision-view";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdminPermission("ADMIN_VIEW_ORDERS");
  const result = await AdminService.getOrders({ page: 1, pageSize: 50 });

  return (
    <OrderSupervisionView
      initialOrders={result.items.map(o => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
