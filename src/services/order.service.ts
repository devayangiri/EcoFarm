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
    CONFIRMED: ["PROCESSING", "CANCELLED_BY_BUYER", "CANCELLED_BY_SELLER"],
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
   * Cancel order by buyer (allowed only if order is in PLACED or CONFIRMED status)
   * Supports both sub-order ID (Order) and OrderGroup ID.
   */
  static async cancelOrderByBuyer(buyerId: string, orderOrGroupId: string, reason: string) {
    if (!reason || reason.trim().length < 3) {
      throw AppError.validation("A valid cancellation reason is required (at least 3 characters)");
    }

    const trimmedReason = reason.trim();

    // Check if orderOrGroupId is a single sub-order (Order)
    const existingSubOrder = await prisma.order.findUnique({
      where: { id: orderOrGroupId },
      include: {
        orderGroup: true,
        items: true,
      },
    });

    if (existingSubOrder) {
      if (existingSubOrder.orderGroup.buyerId !== buyerId) {
        throw AppError.forbidden("You do not have permission to cancel this order");
      }

      if (existingSubOrder.status === "CANCELLED_BY_BUYER" || existingSubOrder.status === "CANCELLED_BY_SELLER") {
        throw AppError.businessRule("This order has already been cancelled");
      }

      if (existingSubOrder.status !== "PLACED" && existingSubOrder.status !== "CONFIRMED") {
        throw AppError.businessRule(
          `Orders in "${existingSubOrder.status}" status cannot be cancelled because fulfillment has already begun.`
        );
      }

      return await prisma.$transaction(async (tx) => {
        // Atomic re-read inside transaction for race-condition protection
        const currentOrder = await tx.order.findUnique({
          where: { id: existingSubOrder.id },
          include: {
            items: true,
          },
        });

        if (!currentOrder) {
          throw AppError.notFound("Order not found");
        }

        if (currentOrder.status !== "PLACED" && currentOrder.status !== "CONFIRMED") {
          throw AppError.businessRule(
            `Order state changed to "${currentOrder.status}" and cannot be cancelled.`
          );
        }

        // 1. Atomic inventory release & revive OUT_OF_STOCK -> ACTIVE
        for (const item of currentOrder.items) {
          const updatedProduct = await tx.product.update({
            where: { id: item.productId },
            data: {
              availableStock: { increment: item.quantity },
            },
            select: { id: true, availableStock: true, status: true },
          });

          if (updatedProduct.status === "OUT_OF_STOCK" && Number(updatedProduct.availableStock) > 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { status: "ACTIVE" },
            });
          }
        }

        // 2. Transition Order to CANCELLED_BY_BUYER
        const cancelledOrder = await tx.order.update({
          where: { id: currentOrder.id },
          data: { status: "CANCELLED_BY_BUYER" },
        });

        // 3. Order Timeline
        await tx.orderTimeline.create({
          data: {
            orderId: currentOrder.id,
            status: "CANCELLED_BY_BUYER",
            actorId: buyerId,
            note: `Cancelled by buyer: ${trimmedReason}`,
          },
        });

        // 4. Notifications
        // To Seller
        await tx.notification.create({
          data: {
            userId: currentOrder.sellerId,
            type: "ORDER_UPDATE",
            title: "Order Cancelled by Buyer",
            body: `Order ${currentOrder.subOrderNumber} was cancelled by buyer. Reason: ${trimmedReason}`,
          },
        });

        // To Buyer
        await tx.notification.create({
          data: {
            userId: buyerId,
            type: "ORDER_UPDATE",
            title: "Order Cancelled",
            body: `Your order ${currentOrder.subOrderNumber} has been successfully cancelled.`,
          },
        });

        // 5. Audit Log
        await tx.auditLog.create({
          data: {
            actorUserId: buyerId,
            action: "ORDER_CANCELLED",
            resource: "Order",
            resourceId: currentOrder.id,
            metadata: {
              reason: trimmedReason,
              cancelledBy: "BUYER",
              subOrderNumber: currentOrder.subOrderNumber,
              orderGroupId: currentOrder.orderGroupId,
            },
          },
        });

        // 6. Check sibling orders in OrderGroup
        const siblingOrders = await tx.order.findMany({
          where: { orderGroupId: currentOrder.orderGroupId },
          select: { id: true, status: true },
        });

        const allCancelled = siblingOrders.every(
          (o) => o.status === "CANCELLED_BY_BUYER" || o.status === "CANCELLED_BY_SELLER"
        );

        if (allCancelled) {
          await tx.orderGroup.update({
            where: { id: currentOrder.orderGroupId },
            data: { status: "CANCELLED" },
          });

          // Cancel any pending payment (e.g. COD)
          await tx.payment.updateMany({
            where: {
              orderGroupId: currentOrder.orderGroupId,
              status: "PENDING",
            },
            data: { status: "CANCELLED" },
          });
        }

        return cancelledOrder;
      });
    }

    // Otherwise check if orderOrGroupId is an OrderGroup
    const existingGroup = await prisma.orderGroup.findUnique({
      where: { id: orderOrGroupId },
      include: {
        sellerOrders: {
          include: { items: true },
        },
      },
    });

    if (!existingGroup) {
      throw AppError.notFound("Order not found");
    }

    if (existingGroup.buyerId !== buyerId) {
      throw AppError.forbidden("You do not have permission to cancel this order");
    }

    if (existingGroup.status === "CANCELLED") {
      throw AppError.businessRule("This order has already been cancelled");
    }

    const cancellableSubOrders = existingGroup.sellerOrders.filter(
      (so) => so.status === "PLACED" || so.status === "CONFIRMED"
    );

    if (cancellableSubOrders.length === 0) {
      throw AppError.businessRule(
        "No cancellable sub-orders remaining. Fulfillment has already started for all shipments."
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Re-read group and sub-orders inside transaction
      const groupInTx = await tx.orderGroup.findUnique({
        where: { id: existingGroup.id },
        include: {
          sellerOrders: {
            include: { items: true },
          },
        },
      });

      if (!groupInTx) throw AppError.notFound("Order group not found");

      const subOrdersToCancel = groupInTx.sellerOrders.filter(
        (so) => so.status === "PLACED" || so.status === "CONFIRMED"
      );

      for (const subOrder of subOrdersToCancel) {
        // 1. Release inventory
        for (const item of subOrder.items) {
          const updatedProduct = await tx.product.update({
            where: { id: item.productId },
            data: {
              availableStock: { increment: item.quantity },
            },
            select: { id: true, availableStock: true, status: true },
          });

          if (updatedProduct.status === "OUT_OF_STOCK" && Number(updatedProduct.availableStock) > 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { status: "ACTIVE" },
            });
          }
        }

        // 2. Update sub-order
        await tx.order.update({
          where: { id: subOrder.id },
          data: { status: "CANCELLED_BY_BUYER" },
        });

        // 3. Timeline
        await tx.orderTimeline.create({
          data: {
            orderId: subOrder.id,
            status: "CANCELLED_BY_BUYER",
            actorId: buyerId,
            note: `Cancelled by buyer: ${trimmedReason}`,
          },
        });

        // 4. Notifications
        await tx.notification.create({
          data: {
            userId: subOrder.sellerId,
            type: "ORDER_UPDATE",
            title: "Order Cancelled by Buyer",
            body: `Order ${subOrder.subOrderNumber} was cancelled by buyer. Reason: ${trimmedReason}`,
          },
        });

        // 5. Audit Log
        await tx.auditLog.create({
          data: {
            actorUserId: buyerId,
            action: "ORDER_CANCELLED",
            resource: "Order",
            resourceId: subOrder.id,
            metadata: {
              reason: trimmedReason,
              cancelledBy: "BUYER",
              subOrderNumber: subOrder.subOrderNumber,
              orderGroupId: groupInTx.id,
            },
          },
        });
      }

      // Check all sub-orders of the group
      const allOrders = await tx.order.findMany({
        where: { orderGroupId: groupInTx.id },
        select: { id: true, status: true },
      });

      const allCancelled = allOrders.every(
        (o) => o.status === "CANCELLED_BY_BUYER" || o.status === "CANCELLED_BY_SELLER"
      );

      let groupStatus: OrderGroupStatus = groupInTx.status;
      if (allCancelled) {
        groupStatus = "CANCELLED";
        await tx.orderGroup.update({
          where: { id: groupInTx.id },
          data: { status: "CANCELLED" },
        });

        // Cancel pending payments (e.g. COD)
        await tx.payment.updateMany({
          where: {
            orderGroupId: groupInTx.id,
            status: "PENDING",
          },
          data: { status: "CANCELLED" },
        });
      }

      // Buyer Notification for whole group
      await tx.notification.create({
        data: {
          userId: buyerId,
          type: "ORDER_UPDATE",
          title: "Order Cancellation Processed",
          body: `Order ${groupInTx.orderNumber} cancellation request has been processed. ${subOrdersToCancel.length} sub-order(s) cancelled.`,
        },
      });

      return {
        id: groupInTx.id,
        orderNumber: groupInTx.orderNumber,
        status: groupStatus,
        cancelledSubOrdersCount: subOrdersToCancel.length,
      };
    });
  }
}
