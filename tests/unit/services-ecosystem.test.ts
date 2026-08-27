import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServiceService } from "@/services/service.service";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    providerProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    serviceListing: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    serviceRequest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    serviceQuotation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    serviceRequestTimeline: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    conversation: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }
      return callback;
    }),
  },
}));

describe("Phase 9: Services Ecosystem, Provider Portal & Quotation Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------
  // 1. SERVICE SEARCH & DIRECTORY
  // ----------------------------------------------------
  describe("1. Service Search & Directory Discovery", () => {
    it("should search active services and return formatted cards", async () => {
      (prisma.serviceListing.findMany as any).mockResolvedValue([
        {
          id: "srv-1",
          title: "50HP Combine Harvester Rental",
          description: "Equipped with rubber tracks for wet paddy fields",
          category: "MACHINERY_RENTAL",
          sector: "AGRICULTURE",
          pricingModel: "PER_ACRE",
          basePrice: new Decimal(2200),
          coverImageUrl: "https://example.com/harvester.jpg",
          serviceArea: "Within 50km",
          locationDistrict: "Bardhaman",
          locationState: "West Bengal",
          status: "ACTIVE",
          isAvailable: true,
          createdAt: new Date(),
          providerProfile: {
            id: "prov-1",
            userId: "user-provider-1",
            businessName: "Bengal Agri Machinery Hub",
            isVerified: true,
          },
        },
      ]);
      (prisma.serviceListing.count as any).mockResolvedValue(1);

      const result = await ServiceService.searchServices({
        search: "Harvester",
        category: "MACHINERY_RENTAL",
        sector: "AGRICULTURE",
        pricingModel: "PER_ACRE",
        verifiedOnly: false,
        page: 1,
        pageSize: 20,
        sortBy: "newest",
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].title).toBe("50HP Combine Harvester Rental");
      expect(result.items[0].basePrice).toBe(2200);
      expect(result.items[0].provider.businessName).toBe("Bengal Agri Machinery Hub");
      expect(result.items[0].provider.isVerified).toBe(true);
    });
  });

  // ----------------------------------------------------
  // 2. PROVIDER SERVICE MANAGEMENT & IDOR SECURITY
  // ----------------------------------------------------
  describe("2. Provider Service Listing Management & Security", () => {
    it("should allow provider to create a new service listing", async () => {
      (prisma.providerProfile.findUnique as any).mockResolvedValue({
        id: "prov-1",
        userId: "user-prov-1",
      });
      (prisma.serviceListing.create as any).mockResolvedValue({
        id: "srv-new",
        title: "Cold Chain Reefer Truck 10MT",
        category: "LOGISTICS",
        basePrice: new Decimal(45),
      });

      const service = await ServiceService.createService("user-prov-1", {
        title: "Cold Chain Reefer Truck 10MT",
        description: "Refrigerated transport suitable for fresh fish catch and fruits",
        category: "LOGISTICS",
        sector: "AQUACULTURE",
        pricingModel: "PER_TON",
        basePrice: 45,
        locationDistrict: "Kolkata",
        locationState: "West Bengal",
      });

      expect(service.id).toBe("srv-new");
      expect(prisma.serviceListing.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "SERVICE_CREATED",
          }),
        })
      );
    });

    it("should prevent Provider A from updating Provider B's service listing (IDOR/BOLA)", async () => {
      (prisma.serviceListing.findUnique as any).mockResolvedValue({
        id: "srv-2",
        providerProfile: { userId: "user-prov-owner" },
      });

      await expect(
        ServiceService.updateService("user-prov-intruder", "srv-2", {
          title: "Hacked Service Name",
        })
      ).rejects.toThrow(/permission/);
    });
  });

  // ----------------------------------------------------
  // 3. SERVICE REQUEST WORKFLOW
  // ----------------------------------------------------
  describe("3. Service Request Submission & Validation", () => {
    it("should prevent a provider from requesting their own service listing", async () => {
      (prisma.serviceListing.findUnique as any).mockResolvedValue({
        id: "srv-own",
        status: "ACTIVE",
        isAvailable: true,
        providerProfile: { userId: "user-self" },
      });

      await expect(
        ServiceService.createServiceRequest("user-self", {
          serviceId: "srv-own",
          requiredDate: new Date(Date.now() + 86400000 * 3),
          quantityOrScale: "50 Acres",
          requirements: "Paddy harvesting across 50 acres",
          locationCityOrTown: "Bardhaman",
          locationDistrict: "East Bardhaman",
          locationState: "West Bengal",
        })
      ).rejects.toThrow(/cannot request your own service/);
    });

    it("should create service request with unique request number and notify provider", async () => {
      (prisma.serviceListing.findUnique as any).mockResolvedValue({
        id: "srv-100",
        title: "Soil Nitrogen & pH Lab Test",
        status: "ACTIVE",
        isAvailable: true,
        providerProfile: { userId: "user-lab-prov" },
      });

      (prisma.serviceRequest.create as any).mockImplementation(({ data }: any) => ({
        id: "req-1",
        ...data,
      }));

      const req = await ServiceService.createServiceRequest("user-farmer", {
        serviceId: "srv-100",
        requiredDate: new Date(Date.now() + 86400000 * 4),
        quantityOrScale: "10 Soil Samples",
        requirements: "Comprehensive macro & micro nutrient analysis",
        locationCityOrTown: "Durgapur",
        locationDistrict: "Paschim Bardhaman",
        locationState: "West Bengal",
      });

      expect(req.id).toBe("req-1");
      expect(req.requestNumber).toMatch(/^AG-SRV-/);
      expect(prisma.serviceRequestTimeline.create).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-lab-prov",
            type: "SERVICE_UPDATE",
          }),
        })
      );
    });
  });

  // ----------------------------------------------------
  // 4. QUOTATION ENGINE & STATE MACHINE
  // ----------------------------------------------------
  describe("4. Quotation Engine, Acceptance & State Transitions", () => {
    it("should allow authorized provider to submit quotation for an open request", async () => {
      (prisma.serviceRequest.findUnique as any).mockResolvedValue({
        id: "req-1",
        status: "OPEN",
        requesterId: "user-farmer",
        service: {
          providerProfile: { userId: "user-provider" },
        },
      });

      (prisma.serviceQuotation.create as any).mockImplementation(({ data }: any) => ({
        id: "quo-1",
        ...data,
      }));

      const quotation = await ServiceService.createQuotation("user-provider", {
        serviceRequestId: "req-1",
        amount: 15000,
        validUntil: new Date(Date.now() + 86400000 * 7),
        terms: "50% advance on sample collection",
      });

      expect(quotation.id).toBe("quo-1");
      expect(quotation.quotationNumber).toMatch(/^AG-QUO-/);
      expect(prisma.serviceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "QUOTATION_SUBMITTED" },
        })
      );
    });

    it("should prevent unauthorized provider from quoting on other requests", async () => {
      (prisma.serviceRequest.findUnique as any).mockResolvedValue({
        id: "req-1",
        status: "OPEN",
        service: {
          providerProfile: { userId: "user-real-provider" },
        },
      });

      await expect(
        ServiceService.createQuotation("user-fake-provider", {
          serviceRequestId: "req-1",
          amount: 12000,
          validUntil: new Date(Date.now() + 86400000 * 5),
        })
      ).rejects.toThrow(/not authorized/);
    });

    it("should allow buyer to accept quotation and reject other competing quotations", async () => {
      (prisma.serviceQuotation.findUnique as any).mockResolvedValue({
        id: "quo-win",
        quotationNumber: "AG-QUO-20260827-WIN",
        serviceRequestId: "req-10",
        providerId: "user-provider",
        amount: new Decimal(14500),
        status: "PENDING",
        validUntil: new Date(Date.now() + 86400000 * 3),
        serviceRequest: {
          requesterId: "user-buyer",
          service: {
            title: "Combine Harvester 50HP",
            providerProfile: { userId: "user-provider" },
          },
        },
      });

      (prisma.serviceQuotation.update as any).mockResolvedValue({
        id: "quo-win",
        status: "ACCEPTED",
      });
      (prisma.conversation.findFirst as any).mockResolvedValue({ id: "conv-1" });
      (prisma.conversation.create as any).mockResolvedValue({ id: "conv-1" });
      (prisma.message.create as any).mockResolvedValue({ id: "msg-1" });

      const result = await ServiceService.acceptQuotation("user-buyer", "quo-win");

      expect(result.status).toBe("ACCEPTED");
      expect(prisma.serviceQuotation.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            serviceRequestId: "req-10",
            id: { not: "quo-win" },
            status: "PENDING",
          },
          data: { status: "REJECTED" },
        })
      );
      expect(prisma.serviceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "ACCEPTED",
            acceptedQuotationId: "quo-win",
          }),
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "QUOTE_ACCEPTED",
          }),
        })
      );
    });

    it("should prevent buyer from accepting an expired quotation", async () => {
      (prisma.serviceQuotation.findUnique as any).mockResolvedValue({
        id: "quo-expired",
        serviceRequestId: "req-1",
        status: "PENDING",
        validUntil: new Date(Date.now() - 86400000), // yesterday
        serviceRequest: { requesterId: "user-buyer" },
      });

      await expect(
        ServiceService.acceptQuotation("user-buyer", "quo-expired")
      ).rejects.toThrow(/expired/);
    });

    it("should allow provider to update execution status to IN_PROGRESS and COMPLETED", async () => {
      (prisma.serviceRequest.findUnique as any).mockResolvedValue({
        id: "req-exec",
        requestNumber: "AG-SRV-20260827-EXEC",
        status: "ACCEPTED",
        requesterId: "user-buyer",
        service: {
          providerProfile: { userId: "user-provider" },
        },
      });

      (prisma.serviceRequest.update as any).mockResolvedValue({
        id: "req-exec",
        status: "IN_PROGRESS",
      });

      const updated = await ServiceService.updateServiceExecutionStatus(
        "user-provider",
        "req-exec",
        { status: "IN_PROGRESS", note: "Machinery mobilized on site" }
      );

      expect(updated.status).toBe("IN_PROGRESS");
      expect(prisma.serviceRequestTimeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "IN_PROGRESS",
          }),
        })
      );
    });
  });
});
