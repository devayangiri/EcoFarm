import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdminService } from "@/services/admin.service";
import { requireAdminPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/services/notification.service";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    verificationRequest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    dispute: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    report: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    adminSetting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock("@/lib/rbac", async () => {
  const actual = await vi.importActual<any>("@/lib/rbac");
  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

vi.mock("@/services/notification.service", () => ({
  NotificationService: {
    createNotificationFromEvent: vi.fn().mockResolvedValue({ id: "notif-1" }),
    createNotificationsForRecipients: vi.fn().mockResolvedValue([]),
  },
}));

describe("Phase 13 — Admin Control Center & Governance Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Admin RBAC & Granular Permission Security", () => {
    it("allows ADMIN with specific permission in matrix", async () => {
      const { hasPermission } = await import("@/lib/rbac");
      expect(hasPermission("ADMIN", "ADMIN_VIEW_DASHBOARD")).toBe(true);
      expect(hasPermission("ADMIN", "ADMIN_VIEW_USERS")).toBe(true);
      expect(hasPermission("ADMIN", "ADMIN_MODERATE_PRODUCTS")).toBe(true);
      expect(hasPermission("ADMIN", "ADMIN_VIEW_AUDIT_LOGS")).toBe(true);
      expect(hasPermission("ADMIN", "ADMIN_MANAGE_SETTINGS")).toBe(true);
    });

    it("rejects non-admin roles for administrative permissions", async () => {
      const { hasPermission } = await import("@/lib/rbac");
      expect(hasPermission("FARMER", "ADMIN_VIEW_DASHBOARD")).toBe(false);
      expect(hasPermission("BUYER", "ADMIN_VIEW_USERS")).toBe(false);
      expect(hasPermission("AGENT", "ADMIN_MODERATE_PRODUCTS")).toBe(false);
      expect(hasPermission("SERVICE_PROVIDER", "ADMIN_VIEW_AUDIT_LOGS")).toBe(false);
    });
  });

  describe("2. User Management & Self-Protection Safety Guards", () => {
    it("prevents an admin from suspending their own account", async () => {
      await expect(
        AdminService.updateUserStatus("admin-1", "admin-1", {
          status: "SUSPENDED",
          reason: "Accidental self-suspension",
        })
      ).rejects.toThrow("Administrators cannot suspend their own account");
    });

    it("prevents suspending the last active administrator", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "admin-2",
        role: "ADMIN",
        status: "ACTIVE",
      } as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1); // Only 1 active admin

      await expect(
        AdminService.updateUserStatus("admin-1", "admin-2", {
          status: "SUSPENDED",
          reason: "Test",
        })
      ).rejects.toThrow("Cannot suspend the last active platform administrator");
    });

    it("prevents self-role modification", async () => {
      await expect(
        AdminService.updateUserRole("admin-1", "admin-1", {
          role: "BUYER",
          reason: "Self demotion",
        })
      ).rejects.toThrow("Administrators cannot modify their own role");
    });

    it("increments tokenVersion and writes AuditLog on status change", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-target",
        fullName: "Target User",
        role: "BUYER",
        status: "ACTIVE",
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user-target",
        fullName: "Target User",
        status: "SUSPENDED",
      } as any);

      const res = await AdminService.updateUserStatus("admin-1", "user-target", {
        status: "SUSPENDED",
        reason: "TOS Violation",
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-target" },
          data: expect.objectContaining({
            status: "SUSPENDED",
            tokenVersion: { increment: 1 },
          }),
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "USER_SUSPENDED",
            resource: "User",
            resourceId: "user-target",
          }),
        })
      );
      expect(res.status).toBe("SUSPENDED");
    });
  });

  describe("3. Product Moderation Lifecycle", () => {
    it("approves pending product, logs audit, and sends seller notification", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-1",
        title: "Organic Rice",
        sellerId: "seller-1",
        status: "PENDING_MODERATION",
      } as any);
      vi.mocked(prisma.product.update).mockResolvedValue({
        id: "prod-1",
        status: "ACTIVE",
      } as any);

      const res = await AdminService.moderateProduct("admin-1", "prod-1", {
        action: "APPROVE",
      });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prod-1" },
          data: { status: "ACTIVE" },
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "PRODUCT_APPROVED",
            resource: "Product",
            resourceId: "prod-1",
          }),
        })
      );
      expect(NotificationService.createNotificationFromEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "seller-1",
          type: "PRODUCT_MODERATION",
        })
      );
      expect(res.status).toBe("ACTIVE");
    });
  });

  describe("4. Polymorphic Target Existence Validation", () => {
    it("throws 404 when referenced product targetId does not exist", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(
        AdminService.validatePolymorphicTarget("PRODUCT", "non-existent-id")
      ).rejects.toThrow("Referenced Product with ID non-existent-id not found");
    });

    it("passes when referenced product targetId exists", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "prod-valid" } as any);

      const isValid = await AdminService.validatePolymorphicTarget("PRODUCT", "prod-valid");
      expect(isValid).toBe(true);
    });
  });

  describe("5. Admin Settings Secret Rejection", () => {
    it("rejects attempt to store secret credentials in settings key", async () => {
      await expect(
        AdminService.updateAdminSetting("admin-1", {
          key: "PAYMENT_GATEWAY_API_KEY",
          value: { key: "secret-123" },
        })
      ).rejects.toThrow(
        "AdminSetting is restricted to public configuration and must never store secrets or credentials"
      );
    });

    it("rejects attempt to store secret credentials inside setting value JSON", async () => {
      await expect(
        AdminService.updateAdminSetting("admin-1", {
          key: "GENERAL_CONFIG",
          value: { database_password: "supersecretpassword" },
        })
      ).rejects.toThrow("AdminSetting value must not contain sensitive credential fields");
    });
  });

  describe("6. Platform Analytics Calculations", () => {
    it("handles zero data periods safely without division by zero errors", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      vi.mocked(prisma.order.count).mockResolvedValue(0);
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { sellerTotal: null },
      } as any);
      vi.mocked(prisma.product.count).mockResolvedValue(0);
      vi.mocked(prisma.verificationRequest.count).mockResolvedValue(0);
      vi.mocked(prisma.user.groupBy).mockResolvedValue([]);

      const analytics = await AdminService.getAnalytics("30d");

      expect(analytics.summary.gmv).toBe(0);
      expect(analytics.summary.completedOrderRate).toBe(0);
      expect(analytics.summary.averageOrderValue).toBe(0);
      expect(analytics.summary.verificationRate).toBe(0);
    });
  });
});
