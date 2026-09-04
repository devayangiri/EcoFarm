import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { NotificationService } from "@/services/notification.service";
import {
  DisputeStatus,
  OrderStatus,
  Prisma,
  ProductStatus,
  ReportStatus,
  ReportTargetType,
  ReviewStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import {
  AdminSettingUpdateInput,
  AdminUserFilterInput,
  AssignVerificationInput,
  AuditLogFilterInput,
  CreateReportInput,
  CreateReviewInput,
  DisputeFilterInput,
  DisputeUpdateInput,
  OrderIssueActionInput,
  OrderSupervisionFilterInput,
  ProductModerationActionInput,
  ProductModerationFilterInput,
  ReportFilterInput,
  ReportResolveInput,
  ReviewFilterInput,
  ReviewModerationInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from "@/lib/validators/admin.schema";

export class AdminService {
  /**
   * Server-side polymorphic target existence validator
   */
  static async validatePolymorphicTarget(
    targetType: ReportTargetType | "SELLER" | "AGENT",
    targetId: string
  ): Promise<boolean> {
    switch (targetType) {
      case "PRODUCT": {
        const item = await prisma.product.findUnique({ where: { id: targetId } });
        if (!item) throw AppError.notFound(`Referenced Product with ID ${targetId} not found`);
        return true;
      }
      case "USER": {
        const item = await prisma.user.findUnique({ where: { id: targetId } });
        if (!item) throw AppError.notFound(`Referenced User with ID ${targetId} not found`);
        return true;
      }
      case "SELLER": {
        const item = await prisma.user.findUnique({ where: { id: targetId, role: "FARMER" } });
        if (!item) throw AppError.notFound(`Referenced Seller with ID ${targetId} not found`);
        return true;
      }
      case "AGENT": {
        const item = await prisma.user.findUnique({ where: { id: targetId, role: "AGENT" } });
        if (!item) throw AppError.notFound(`Referenced Agent with ID ${targetId} not found`);
        return true;
      }
      case "BUSINESS": {
        const item = await prisma.networkProfile.findFirst({
          where: { OR: [{ id: targetId }, { userId: targetId }] },
        });
        if (!item) throw AppError.notFound(`Referenced Business Profile with ID ${targetId} not found`);
        return true;
      }
      case "SERVICE": {
        const item = await prisma.serviceListing.findUnique({ where: { id: targetId } });
        if (!item) throw AppError.notFound(`Referenced Service with ID ${targetId} not found`);
        return true;
      }
      case "MESSAGE": {
        const item = await prisma.message.findUnique({ where: { id: targetId } });
        if (!item) throw AppError.notFound(`Referenced Message with ID ${targetId} not found`);
        return true;
      }
      case "REVIEW": {
        const item = await prisma.review.findUnique({ where: { id: targetId } });
        if (!item) throw AppError.notFound(`Referenced Review with ID ${targetId} not found`);
        return true;
      }
      default:
        throw AppError.businessRule(`Unsupported target type: ${targetType}`);
    }
  }

  /**
   * Get Platform Overview Dashboard Metrics
   * Documented Formulas:
   * - GMV: Sum of sellerTotal for orders with status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED')
   * - Active User Rate: (Active Users / Total Users) * 100
   * - Verification Approval Rate: (Approved Verifications / Total Reviewed) * 100
   */
  static async getDashboardMetrics(adminUserId: string) {
    const [
      totalUsers,
      activeUsers,
      pendingVerifications,
      pendingProducts,
      activeOrders,
      openDisputes,
      openReports,
      completedOrders,
      gmvAggregate,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      prisma.product.count({ where: { status: "PENDING_MODERATION" } }),
      prisma.order.count({
        where: { status: { in: ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED"] } },
      }),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.order.count({ where: { status: { in: ["DELIVERED", "COMPLETED"] } } }),
      prisma.order.aggregate({
        _sum: { sellerTotal: true },
        where: {
          status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actorUser: { select: { id: true, fullName: true, role: true } } },
      }),
    ]);

    const gmv = gmvAggregate?._sum?.sellerTotal ? gmvAggregate._sum.sellerTotal.toNumber() : 0;
    const activeUserRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    return {
      metrics: {
        totalUsers,
        activeUsers,
        activeUserRate,
        pendingVerifications,
        pendingProducts,
        activeOrders,
        completedOrders,
        openDisputes,
        openReports,
        gmv,
      },
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        resource: a.resource,
        resourceId: a.resourceId,
        actorName: a.actorUser?.fullName || "System",
        actorRole: a.actorUser?.role || "SYSTEM",
        createdAt: a.createdAt,
      })),
    };
  }

  /**
   * User Management: List users with filters and pagination (Safe Projection)
   */
  static async getUsers(filter: AdminUserFilterInput) {
    const page = filter.page || 1;
    const pageSize = Math.min(filter.pageSize || 20, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      ...(filter.role ? { role: filter.role } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { fullName: { contains: filter.search, mode: "insensitive" } },
              { email: { contains: filter.search, mode: "insensitive" } },
              { phone: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          farmerProfile: { select: { isVerified: true, experienceYears: true } },
          buyerProfile: { select: { companyName: true, buyerType: true } },
          providerProfile: { select: { isVerified: true, businessName: true } },
          networkProfile: { select: { isVerified: true, displayName: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        isVerified:
          u.farmerProfile?.isVerified ||
          u.providerProfile?.isVerified ||
          u.networkProfile?.isVerified ||
          false,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * User Details: Administrative inspect with activity statistics
   */
  static async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: { include: { farms: true } },
        buyerProfile: true,
        agentProfile: true,
        providerProfile: { include: { services: true } },
        networkProfile: true,
        verificationRequests: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    const [orderCount, productCount, reportCount] = await Promise.all([
      prisma.order.count({ where: { sellerId: userId } }),
      prisma.product.count({ where: { sellerId: userId } }),
      prisma.report.count({ where: { targetId: userId } }),
    ]);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      profiles: {
        farmer: user.farmerProfile,
        buyer: user.buyerProfile,
        agent: user.agentProfile,
        provider: user.providerProfile,
        network: user.networkProfile,
      },
      verificationRequests: user.verificationRequests,
      activity: {
        orderCount,
        productCount,
        reportCount,
      },
    };
  }

  /**
   * Update User Account Status (With tokenVersion Invalidation & Self-Protection)
   */
  static async updateUserStatus(
    adminUserId: string,
    targetUserId: string,
    input: UpdateUserStatusInput
  ) {
    if (adminUserId === targetUserId && input.status === "SUSPENDED") {
      throw AppError.businessRule("Administrators cannot suspend their own account");
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw AppError.notFound("Target user not found");

    if (targetUser.role === "ADMIN" && input.status === "SUSPENDED") {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", status: "ACTIVE" },
      });
      if (activeAdminCount <= 1) {
        throw AppError.businessRule("Cannot suspend the last active platform administrator");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Invalidate session tokens by incrementing tokenVersion
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: {
          status: input.status,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: input.status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED",
          resource: "User",
          resourceId: targetUserId,
          metadata: {
            previousStatus: targetUser.status,
            newStatus: input.status,
            reason: input.reason,
          },
        },
      });

      return u;
    });

    // Notify user
    await NotificationService.createNotificationFromEvent({
      userId: targetUserId,
      type: "SYSTEM",
      title: input.status === "SUSPENDED" ? "Account Suspended" : "Account Reactivated",
      body:
        input.reason ||
        (input.status === "SUSPENDED"
          ? "Your account has been suspended by administration."
          : "Your account has been reactivated."),
      resourceType: "User",
      resourceId: targetUserId,
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      status: updated.status,
    };
  }

  /**
   * Update User Role (With Removal of Last Admin & Self-Escalation Guards)
   */
  static async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    input: UpdateUserRoleInput
  ) {
    if (adminUserId === targetUserId) {
      throw AppError.businessRule("Administrators cannot modify their own role");
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw AppError.notFound("Target user not found");

    if (targetUser.role === "ADMIN" && input.role !== "ADMIN") {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", status: "ACTIVE" },
      });
      if (activeAdminCount <= 1) {
        throw AppError.businessRule("Cannot remove or demote the last active platform administrator");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: {
          role: input.role,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "USER_ROLE_CHANGED",
          resource: "User",
          resourceId: targetUserId,
          metadata: {
            previousRole: targetUser.role,
            newRole: input.role,
            reason: input.reason,
          },
        },
      });

      return u;
    });

    // Notify user
    await NotificationService.createNotificationFromEvent({
      userId: targetUserId,
      type: "SYSTEM",
      title: "Account Role Updated",
      body: `Your platform role has been updated to ${input.role}.`,
      resourceType: "User",
      resourceId: targetUserId,
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      role: updated.role,
    };
  }

  /**
   * Product Moderation: List products
   */
  static async getProductsForModeration(filter: ProductModerationFilterInput) {
    const page = filter.page || 1;
    const pageSize = Math.min(filter.pageSize || 20, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {
      ...(filter.status ? { status: filter.status as ProductStatus } : {}),
      ...(filter.sector ? { sector: filter.sector } : {}),
      ...(filter.search
        ? {
            OR: [
              { title: { contains: filter.search, mode: "insensitive" } },
              { category: { contains: filter.search, mode: "insensitive" } },
              { seller: { fullName: { contains: filter.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          seller: { select: { id: true, fullName: true, email: true } },
          images: { take: 1 },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: products.map((p) => ({
        id: p.id,
        title: p.title,
        sector: p.sector,
        category: p.category,
        pricePerUnit: p.pricePerUnit.toNumber(),
        unit: p.unit,
        availableStock: p.availableStock.toNumber(),
        status: p.status,
        seller: p.seller,
        thumbnail: p.images[0]?.url || null,
        location: `${p.locationDistrict}, ${p.locationState}`,
        createdAt: p.createdAt,
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Moderate Product (Approve, Reject, Pause, Restore)
   */
  static async moderateProduct(
    adminUserId: string,
    productId: string,
    input: ProductModerationActionInput
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product) throw AppError.notFound("Product not found");

    if (product.status === "DRAFT") {
      throw AppError.businessRule(
        "Draft products must be submitted for moderation by the seller before approval."
      );
    }

    let newStatus: ProductStatus = product.status;
    let auditAction = "PRODUCT_MODERATED";

    switch (input.action) {
      case "APPROVE":
        if (product.status !== "PENDING_MODERATION") {
          throw AppError.businessRule(
            `Only products in PENDING_MODERATION can be approved. Current status: ${product.status}`
          );
        }
        newStatus = "ACTIVE";
        auditAction = "PRODUCT_APPROVED";
        break;

      case "REJECT":
        if (product.status !== "PENDING_MODERATION") {
          throw AppError.businessRule(
            `Only products in PENDING_MODERATION can be rejected. Current status: ${product.status}`
          );
        }
        newStatus = "REJECTED";
        auditAction = "PRODUCT_REJECTED";
        break;

      case "PAUSE":
        if (product.status !== "ACTIVE") {
          throw AppError.businessRule(
            `Only ACTIVE products can be paused. Current status: ${product.status}`
          );
        }
        newStatus = "PAUSED";
        auditAction = "PRODUCT_PAUSED";
        break;

      case "RESTORE":
        if (product.status !== "PAUSED") {
          throw AppError.businessRule(
            `Only PAUSED products can be restored to active. Current status: ${product.status}`
          );
        }
        newStatus = "ACTIVE";
        auditAction = "PRODUCT_RESTORED";
        break;

      default:
        throw AppError.validation(`Invalid moderation action: ${input.action}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: productId },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: auditAction,
          resource: "Product",
          resourceId: productId,
          metadata: {
            action: input.action,
            reason: input.reason,
            previousStatus: product.status,
            newStatus,
          },
        },
      });

      return p;
    });

    // Notify seller (Approval-first: non-blocking follow-up after atomic DB commit)
    try {
      const notificationTitle =
        input.action === "APPROVE"
          ? "Product Listing Approved"
          : input.action === "REJECT"
          ? "Product Listing Rejected"
          : input.action === "PAUSE"
          ? "Product Listing Paused"
          : "Product Listing Restored";

      const defaultBody =
        input.action === "APPROVE"
          ? `Your product "${product.title}" has been approved and is now live on the marketplace.`
          : input.action === "REJECT"
          ? `Your product "${product.title}" was not approved by moderators.${input.reason ? ` Reason: ${input.reason}` : ""}`
          : input.action === "PAUSE"
          ? `Your product "${product.title}" has been paused by platform administrators.${input.reason ? ` Reason: ${input.reason}` : ""}`
          : `Your product "${product.title}" has been restored to active status on the marketplace.`;

      await NotificationService.createNotificationFromEvent({
        userId: product.sellerId,
        type: "PRODUCT_MODERATION",
        title: notificationTitle,
        body: input.reason && input.action !== "APPROVE" ? input.reason : defaultBody,
        resourceType: "Product",
        resourceId: productId,
      });
    } catch (notifErr) {
      console.error("[AdminService.moderateProduct] Seller notification delivery failed:", notifErr);
    }

    return updated;
  }

  /**
   * Global Verification Oversight
   */
  static async getVerificationOverview(filter?: { status?: string; page?: number; pageSize?: number }) {
    const page = filter?.page || 1;
    const pageSize = Math.min(filter?.pageSize || 20, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.VerificationRequestWhereInput = {
      ...(filter?.status ? { status: filter.status as any } : {}),
    };

    const [requests, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
          reviewer: { select: { id: true, fullName: true } },
          documents: true,
        },
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    return {
      items: requests,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Assign or Reassign Verification Reviewer
   */
  static async assignVerification(
    adminUserId: string,
    verificationId: string,
    input: AssignVerificationInput
  ) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: verificationId },
    });
    if (!request) throw AppError.notFound("Verification request not found");

    if (input.reviewerId) {
      const reviewer = await prisma.user.findUnique({ where: { id: input.reviewerId } });
      if (!reviewer) throw AppError.notFound("Reviewer user not found");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.verificationRequest.update({
        where: { id: verificationId },
        data: {
          reviewerId: input.reviewerId,
          reviewNotes: input.reviewNotes || request.reviewNotes,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "VERIFICATION_REASSIGNED",
          resource: "VerificationRequest",
          resourceId: verificationId,
          metadata: {
            reviewerId: input.reviewerId,
            reviewNotes: input.reviewNotes,
          },
        },
      });

      return v;
    });

    if (input.reviewerId) {
      await NotificationService.createNotificationFromEvent({
        userId: input.reviewerId,
        type: "VERIFICATION_UPDATE",
        title: "Verification Assignment",
        body: "A verification review has been assigned to you.",
        resourceType: "VerificationRequest",
        resourceId: verificationId,
      });
    }

    return updated;
  }

  /**
   * Order Supervision: Global order supervision
   */
  static async getOrders(filter: OrderSupervisionFilterInput) {
    const page = filter.page || 1;
    const pageSize = Math.min(filter.pageSize || 20, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {
      ...(filter.status ? { status: filter.status as OrderStatus } : {}),
      ...(filter.search
        ? {
            OR: [
              { subOrderNumber: { contains: filter.search, mode: "insensitive" } },
              { seller: { fullName: { contains: filter.search, mode: "insensitive" } } },
              { orderGroup: { buyer: { fullName: { contains: filter.search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          orderGroup: {
            include: { buyer: { select: { id: true, fullName: true, email: true } } },
          },
          seller: { select: { id: true, fullName: true, email: true } },
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((o) => ({
        id: o.id,
        subOrderNumber: o.subOrderNumber,
        buyer: o.orderGroup.buyer,
        seller: o.seller,
        sellerTotal: o.sellerTotal.toNumber(),
        status: o.status,
        itemCount: o.items.length,
        createdAt: o.createdAt,
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Operational Order Issue Override
   */
  static async handleOrderIssue(
    adminUserId: string,
    orderId: string,
    input: OrderIssueActionInput
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderGroup: { include: { buyer: true } },
        seller: true,
      },
    });

    if (!order) throw AppError.notFound("Order not found");

    let newStatus: OrderStatus = order.status;
    if (input.action === "CANCEL_ORDER") {
      newStatus = "CANCELLED_BY_SELLER";
    }

    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "ORDER_OPERATIONAL_OVERRIDE",
          resource: "Order",
          resourceId: orderId,
          metadata: {
            action: input.action,
            reason: input.reason,
            previousStatus: order.status,
            newStatus,
          },
        },
      });

      return o;
    });

    // Notify Buyer and Seller
    await NotificationService.createNotificationsForRecipients(
      [order.orderGroup.buyerId, order.sellerId],
      {
        type: "ORDER_UPDATE",
        title: `Administrative Order Action: #${order.subOrderNumber}`,
        body: input.reason,
        resourceType: "Order",
        resourceId: orderId,
      }
    );

    return updated;
  }

  /**
   * Disputes: List, Create, Update
   */
  static async getDisputes(filter: DisputeFilterInput) {
    const page = filter.page || 1;
    const pageSize = Math.min(filter.pageSize || 20, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.DisputeWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
    };

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          raisedBy: { select: { id: true, fullName: true, role: true } },
          respondent: { select: { id: true, fullName: true, role: true } },
          resolvedBy: { select: { id: true, fullName: true } },
          order: { select: { id: true, subOrderNumber: true } },
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      items: disputes,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  static async updateDispute(
    adminUserId: string,
    disputeId: string,
    input: DisputeUpdateInput
  ) {
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw AppError.notFound("Dispute not found");

    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: input.status,
          resolution: input.resolution,
          resolvedById: adminUserId,
          resolvedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "DISPUTE_RESOLVED",
          resource: "Dispute",
          resourceId: disputeId,
          metadata: {
            status: input.status,
            resolution: input.resolution,
          },
        },
      });

      return d;
    });

    // Notify parties
    const partyIds = [dispute.raisedById];
    if (dispute.respondentId) partyIds.push(dispute.respondentId);

    await NotificationService.createNotificationsForRecipients(partyIds, {
      type: "SYSTEM",
      title: `Dispute #${disputeId.slice(0, 8)} Updated`,
      body: `Resolution status: ${input.status}. ${input.resolution}`,
      resourceType: "Dispute",
      resourceId: disputeId,
    });

    return updated;
  }

  /**
   * Reports: List & Resolve
   */
  static async getReports(filter: ReportFilterInput) {
    const page = filter.page || 1;
    const pageSize = Math.min(filter.pageSize || 20, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReportWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.targetType ? { targetType: filter.targetType } : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          reporter: { select: { id: true, fullName: true, email: true } },
          resolvedBy: { select: { id: true, fullName: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      items: reports,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  static async createReport(reporterUserId: string, input: CreateReportInput) {
    // Validate polymorphic targetId server-side
    await this.validatePolymorphicTarget(input.targetType, input.targetId);

    return prisma.report.create({
      data: {
        reporterId: reporterUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        description: input.description,
      },
    });
  }

  static async resolveReport(
    adminUserId: string,
    reportId: string,
    input: ReportResolveInput
  ) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw AppError.notFound("Report not found");

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.report.update({
        where: { id: reportId },
        data: {
          status: input.status,
          resolutionNotes: input.resolutionNotes,
          resolvedById: adminUserId,
          resolvedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "REPORT_RESOLVED",
          resource: "Report",
          resourceId: reportId,
          metadata: {
            status: input.status,
            resolutionNotes: input.resolutionNotes,
          },
        },
      });

      return r;
    });

    return updated;
  }

  /**
   * Reviews: List, Create, Moderate
   */
  static async getReviews(filter: ReviewFilterInput) {
    const page = filter.page || 1;
    const pageSize = Math.min(filter.pageSize || 20, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReviewWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.targetType ? { targetType: filter.targetType } : {}),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          author: { select: { id: true, fullName: true } },
          moderatedBy: { select: { id: true, fullName: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      items: reviews,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  static async createReview(authorUserId: string, input: CreateReviewInput) {
    // Validate targetId
    await this.validatePolymorphicTarget(input.targetType as any, input.targetId);

    return prisma.review.create({
      data: {
        authorId: authorUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        rating: input.rating,
        comment: input.comment,
        status: "APPROVED",
      },
    });
  }

  static async moderateReview(
    adminUserId: string,
    reviewId: string,
    input: ReviewModerationInput
  ) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw AppError.notFound("Review not found");

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.review.update({
        where: { id: reviewId },
        data: {
          status: input.status,
          moderatedById: adminUserId,
          moderationReason: input.moderationReason,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "REVIEW_MODERATED",
          resource: "Review",
          resourceId: reviewId,
          metadata: {
            status: input.status,
            reason: input.moderationReason,
          },
        },
      });

      return r;
    });

    return updated;
  }

  /**
   * Platform Analytics with Exact Documented Formulas
   * Time range: today (0d), 7d (7 days), 30d (30 days), 90d (90 days), all
   */
  static async getAnalytics(timeRange: "today" | "7d" | "30d" | "90d" | "all" = "30d") {
    let startDate: Date | undefined;
    const now = new Date();

    if (timeRange === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "90d") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

    const [
      newRegistrations,
      totalOrders,
      completedOrders,
      cancelledOrders,
      gmvAggregate,
      productsCreated,
      approvedVerifications,
      totalVerifications,
      roleDistribution,
    ] = await Promise.all([
      prisma.user.count({ where: dateFilter }),
      prisma.order.count({ where: dateFilter }),
      prisma.order.count({
        where: { ...dateFilter, status: { in: ["DELIVERED", "COMPLETED"] } },
      }),
      prisma.order.count({
        where: {
          ...dateFilter,
          status: { in: ["CANCELLED_BY_BUYER", "CANCELLED_BY_SELLER"] },
        },
      }),
      prisma.order.aggregate({
        _sum: { sellerTotal: true },
        where: {
          ...dateFilter,
          status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] },
        },
      }),
      prisma.product.count({ where: dateFilter }),
      prisma.verificationRequest.count({
        where: { ...dateFilter, status: "APPROVED" },
      }),
      prisma.verificationRequest.count({ where: dateFilter }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
    ]);

    const gmv = gmvAggregate?._sum?.sellerTotal ? gmvAggregate._sum.sellerTotal.toNumber() : 0;
    const completedOrderRate =
      totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    const averageOrderValue =
      completedOrders > 0 ? Math.round(gmv / completedOrders) : 0;
    const verificationRate =
      totalVerifications > 0 ? Math.round((approvedVerifications / totalVerifications) * 100) : 0;

    return {
      timeRange,
      summary: {
        newRegistrations,
        totalOrders,
        completedOrders,
        cancelledOrders,
        completedOrderRate, // (Completed / Total) * 100
        gmv, // Sum of sellerTotal for paid/confirmed orders
        averageOrderValue, // GMV / Completed Orders
        productsCreated,
        verificationRate, // (Approved / Total) * 100
      },
      roleDistribution: roleDistribution.map((r) => ({
        role: r.role,
        count: r._count.id,
      })),
    };
  }

  /**
   * Audit Logs: Read-only investigation log stream
   */
  static async getAuditLogs(filter: AuditLogFilterInput) {
    const page = filter.page || 1;
    const pageSize = Math.min(filter.pageSize || 20, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {
      ...(filter.action ? { action: { contains: filter.action, mode: "insensitive" } } : {}),
      ...(filter.resource ? { resource: filter.resource } : {}),
      ...(filter.actorUserId ? { actorUserId: filter.actorUserId } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          actorUser: { select: { id: true, fullName: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs.map((l) => ({
        id: l.id,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        actorUserId: l.actorUserId,
        actorName: l.actorUser?.fullName || "System",
        actorRole: l.actorUser?.role || "SYSTEM",
        metadata: l.metadata,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Admin Settings: Read and Update Platform Configuration
   * Protection: Rejects any attempt to store passwords, api keys, or secrets
   */
  static async getAdminSettings() {
    const settings = await prisma.adminSetting.findMany({
      orderBy: { key: "asc" },
      include: { updatedBy: { select: { id: true, fullName: true } } },
    });

    return settings;
  }

  static async updateAdminSetting(
    adminUserId: string,
    input: AdminSettingUpdateInput
  ) {
    // Secret & Credential rejection guard
    const forbiddenSubstrings = ["password", "secret", "api_key", "token", "private_key"];
    const keyLower = input.key.toLowerCase();
    for (const forbidden of forbiddenSubstrings) {
      if (keyLower.includes(forbidden)) {
        throw AppError.businessRule(
          "AdminSetting is restricted to public configuration and must never store secrets or credentials"
        );
      }
    }

    const valueString = JSON.stringify(input.value).toLowerCase();
    for (const forbidden of forbiddenSubstrings) {
      if (valueString.includes(forbidden)) {
        throw AppError.businessRule(
          "AdminSetting value must not contain sensitive credential fields"
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.adminSetting.upsert({
        where: { key: input.key },
        create: {
          key: input.key,
          value: input.value as Prisma.InputJsonValue,
          description: input.description,
          updatedById: adminUserId,
        },
        update: {
          value: input.value as Prisma.InputJsonValue,
          description: input.description,
          updatedById: adminUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "PLATFORM_SETTING_CHANGED",
          resource: "AdminSetting",
          resourceId: s.id,
          metadata: { key: input.key, value: input.value as Prisma.InputJsonValue },
        },
      });

      return s;
    });

    return updated;
  }
}
