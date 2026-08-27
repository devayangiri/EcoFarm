import { z } from "zod";

export const OrderStatusEnum = z.enum([
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED_BY_SELLER",
  "CANCELLED_BY_BUYER",
  "DISPUTED",
  "REFUNDED",
]);

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
  trackingNumber: z.string().max(100).optional().nullable(),
  shippingCourier: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const CancelOrderSchema = z.object({
  reason: z.string().min(3, "Cancellation reason is required").max(500),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;