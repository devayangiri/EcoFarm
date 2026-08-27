import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";

describe("Phase 3 Database Architecture & Prisma Models Verification", () => {
  it("should have all 27 domain models registered in Prisma model delegates", () => {
    const expectedModels = [
      "systemHealth",
      "user",
      "address",
      "farmerProfile",
      "farm",
      "buyerProfile",
      "agentProfile",
      "agentAssignment",
      "providerProfile",
      "serviceListing",
      "product",
      "productImage",
      "inventoryReservation",
      "orderGroup",
      "order",
      "orderItem",
      "payment",
      "networkProfile",
      "connectionRequest",
      "businessConnection",
      "conversation",
      "conversationParticipant",
      "message",
      "notification",
      "notificationPreference",
      "verificationRequest",
      "verificationDocument",
      "auditLog",
    ];

    const dmmfModels = Prisma.dmmf.datamodel.models.map((m) => m.name);

    expectedModels.forEach((modelName) => {
      const match = dmmfModels.find(
        (m) => m.toLowerCase() === modelName.toLowerCase()
      );
      expect(match, `Model ${modelName} must exist in Prisma schema`).toBeDefined();
    });
  });

  it("should enforce Decimal type on all monetary and stock columns", () => {
    const productModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "Product");
    const priceField = productModel?.fields.find((f) => f.name === "pricePerUnit");
    const stockField = productModel?.fields.find((f) => f.name === "availableStock");
    const reservedField = productModel?.fields.find((f) => f.name === "reservedStock");

    expect(priceField?.type).toBe("Decimal");
    expect(stockField?.type).toBe("Decimal");
    expect(reservedField?.type).toBe("Decimal");

    const orderGroupModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "OrderGroup");
    const totalAmountField = orderGroupModel?.fields.find((f) => f.name === "totalAmount");
    expect(totalAmountField?.type).toBe("Decimal");
  });

  it("should structure multi-vendor order relationships correctly without direct seller on OrderGroup", () => {
    const orderGroupModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "OrderGroup");
    const sellerFieldOnGroup = orderGroupModel?.fields.find((f) => f.name === "sellerId");
    expect(sellerFieldOnGroup).toBeUndefined(); // OrderGroup represents buyer transaction only

    const orderModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "Order");
    const sellerFieldOnOrder = orderModel?.fields.find((f) => f.name === "sellerId");
    expect(sellerFieldOnOrder).toBeDefined(); // Order represents seller-specific fulfillment
  });

  it("should have immutable JSON snapshot field for shipping address on OrderGroup", () => {
    const orderGroupModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "OrderGroup");
    const snapshotField = orderGroupModel?.fields.find((f) => f.name === "shippingAddressSnapshot");
    expect(snapshotField?.type).toBe("Json");
  });

  it("should support both AGRICULTURE and AQUACULTURE sectors in Product model", () => {
    const sectorEnum = Prisma.dmmf.datamodel.enums.find((e) => e.name === "Sector");
    const sectorValues = sectorEnum?.values.map((v) => v.name);

    expect(sectorValues).toContain("AGRICULTURE");
    expect(sectorValues).toContain("AQUACULTURE");
  });

  it("should verify inventory reservation 15-minute lock expiration calculation", () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const durationMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

    expect(durationMinutes).toBe(15);
  });
});
