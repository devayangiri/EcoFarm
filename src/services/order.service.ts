import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { OrderStatus, OrderGroupStatus, Prisma } from "@prisma/client";
import { FEATURES } from "@/config/features";
import type { UpdateOrderStatusInput } from "@/lib/validators/order.schema";

export class OrderService {
  /**
   * Valid Order Status State Machine Transitions
   */
  private static readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PLACED: ["CONFIRMED", "CANCELLED_BY_BUYER", "CANCELLED_BY_SELLER"],
    CONFIRMED: ["PROCESSING", "CANCELLED_BY_SELLER"],
    PROCESSING: ["SHIPPED"],
    SHIPPED: ["DELIVERED", "DISPUTED"],
    DELIVERED: ["COMPLETED", "DISPUTED"],
    COMPLETED: ["REFUNDED"],
    CANCELLED_BY_BUYER: [],
    CANCELLED_BY_SELLER: [],
    DISPUTED: ["REFUNDED", "COMPLETED"],
    REFUNDED: [],
  };

  /**
   * List buyer orders grouped by checkout OrderGroup
   */
  static async getBuyerOrderGroups(buyerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orderGroups, total] = await Promise.all([
      prisma.orderGroup.findMany({
        where: { buyerId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sellerOrders: {
            include: {
              seller: { select: { id: true, fullName: true } },
              items: true,
              ...(FEATURES.ORDER_TIMELINES ? { timeline: { orderBy: { createdAt: "asc" as const } } } : {}),
            },
          },
          payments: true,
        },
      }),
      prisma.orderGroup.count({ where: { buyerId } }),
    ]);

    return {
      orderGroups: orderGroups.map((g) => ({
        ...g,
        sellerOrders: g.sellerOrders.map((so) => ({
          ...so,
          timeline: (so as any).timeline || [],
        })),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single OrderGroup for a buyer with ownership verification
   */
  static async getBuyerOrderGroupById(buyerId: string, orderGroupId: string) {
    const group = await prisma.orderGroup.findUnique({
      where: { id: orderGroupId },
      include: {
        sellerOrders: {
          include: {
            seller: { select: { id: true, fullName: true } },
            items: true,
            ...(FEATURES.ORDER_TIMELINES ? { timeline: { orderBy: { createdAt: "asc" as const } } } : {}),
          },
        },
        payments: true,
      },
    });

    if (!group) {
      throw AppError.notFound("Order group not found");
    }

    if (group.buyerId !== buyerId) {
      throw AppError.forbidden("You do not have permission to view this order");
    }

    return {
      ...group,
      sellerOrders: group.sellerOrders.map((so) => ({
        ...so,
        timeline: (so as any).timeline || [],
      })),
    };
  }

  /**
   * Get single sub-order details for a buyer
   */
  static async getBuyerOrderById(buyerId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderGroup: true,
        seller: { select: { id: true, fullName: true } },
        items: true,
        ...(FEATURES.ORDER_TIMELINES ? { timeline: { orderBy: { createdAt: "asc" as const } } } : {}),
      },
    });

    if (!order) {
      throw AppError.notFound("Order not found");
    }

    if (order.orderGroup.buyerId !== buyerId) {
      throw AppError.forbidden("You do not have permission to view this order");
    }

    return {
      ...order,
      timeline: (order as any).timeline || [],
    };
  }

  /**
   * List orders for a seller/farmer
   */
  static async getSellerOrders(
    sellerId: string,
    status?: OrderStatus,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      sellerId,
      status: status || undefined,
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          orderGroup: {
            select: {
              buyerId: true,
              orderNumber: true,
              shippingAddressSnapshot: true,
              buyer: { select: { id: true, fullName: true } },
            },
          },
          items: true,
          timeline: { orderBy: { createdAt: "asc" } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single order for a seller with ownership verification
   */
  static async getSellerOrderById(sellerId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderGroup: {
          select: {
            buyerId: true,
            orderNumber: true,
            shippingAddressSnapshot: true,
            buyer: { select: { id: true, fullName: true } },
          },
        },
        items: true,
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      throw AppError.notFound("Order not found");
    }

    if (order.sellerId !== sellerId) {
      throw AppError.forbidden("You do not have permission to view this order");
    }

    return order;
  }

  /**
   * Update seller sub-order status through the validated state machine
   */
  static async updateSellerOrderStatus(
    sellerId: string,
    orderId: string,
    input: UpdateOrderStatusInput
  ) {
    const order = await this.getSellerOrderById(sellerId, orderId);

    // Validate state machine transition
    const allowedNextStates = this.VALID_TRANSITIONS[order.status] || [];
    if (!allowedNextStates.includes(input.status)) {
      throw AppError.businessRule(
        `Invalid status transition from "${order.status}" to "${input.status}". Allowed next states: ${allowedNextStates.join(", ")}`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.order.update({
        where: { id: orderId },
        data: {
          status: input.status,
          trackingNumber: input.trackingNumber || undefined,
          shippingCourier: input.shippingCourier || undefined,
        },
        include: {
          orderGroup: true,
          items: true,
        },
      });

      // Add timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId,
          status: input.status,
          actorId: sellerId,
          note: input.note || `Order status updated to ${input.status}`,
        },
      });

      // Re-evaluate Parent OrderGroup status
      const siblingOrders = await tx.order.findMany({
        where: { orderGroupId: order.orderGroupId },
        select: { status: true },
      });

      let parentStatus: OrderGroupStatus = "PROCESSING";
      const allDeliveredOrCompleted = siblingOrders.every(
        (o) => o.status === "DELIVERED" || o.status === "COMPLETED"
      );
      const allCancelled = siblingOrders.every(
        (o) => o.status === "CANCELLED_BY_SELLER" || o.status === "CANCELLED_BY_BUYER"
      );
      const someDelivered = siblingOrders.some(
        (o) => o.status === "DELIVERED" || o.status === "SHIPPED"
      );

      if (allDeliveredOrCompleted) {
        parentStatus = "COMPLETED";
      } else if (allCancelled) {
        parentStatus = "CANCELLED";
      } else if (someDelivered) {
        parentStatus = "PARTIALLY_FULFILLED";
      }

      await tx.orderGroup.update({
        where: { id: order.orderGroupId },
        data: { status: parentStatus },
      });

      // Buyer Notification
      await tx.notification.create({
        data: {
          userId: order.orderGroup.buyerId,
          type: "ORDER_UPDATE",
          title: `Order Status: ${input.status}`,
          body: `Your shipment for order ${order.subOrderNumber} has updated to ${input.status}.`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: sellerId,
          action: "ORDER_STATUS_UPDATED",
          resource: "Order",
          resourceId: orderId,
          metadata: {
            previousStatus: order.status,
            newStatus: input.status,
            trackingNumber: input.trackingNumber,
          },
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Cancel order by buyer (allowed only if order is in PLACED status)
   */
  static async cancelOrderByBuyer(buyerId: string, orderId: string, reason: string) {
    const order = await this.getBuyerOrderById(buyerId, orderId);

    if (order.status !== "PLACED") {
      throw AppError.businessRule(
        `Orders in "${order.status}" status cannot be cancelled by buyer`
      );
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      // Restore inventory quantities
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            availableStock: { increment: item.quantity },
          },
        });
      }

      const res = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED_BY_BUYER" },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: "CANCELLED_BY_BUYER",
          actorId: buyerId,
          note: `Cancelled by buyer: ${reason}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.sellerId,
          type: "ORDER_UPDATE",
          title: "Order Cancelled by Buyer",
          body: `Order ${order.subOrderNumber} was cancelled by the buyer. Reason: ${reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "ORDER_CANCELLED",
          resource: "Order",
          resourceId: orderId,
          metadata: { reason, cancelledBy: "BUYER" },
        },
      });

      return res;
    });

    return cancelled;
  }
}
