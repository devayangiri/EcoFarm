import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma, ServiceCategory, Sector, ServiceStatus, ServiceRequestStatus, ServiceQuotationStatus } from "@prisma/client";
import { FEATURES } from "@/config/features";
import type {
  ServiceDirectorySearchInput,
  CreateServiceListingInput,
  UpdateServiceListingInput,
  CreateServiceRequestInput,
  CreateServiceQuotationInput,
  UpdateServiceExecutionStatusInput,
} from "@/lib/validators/service.schema";

export class ServiceService {
  /**
   * Search active service listings with server-side filtering & pagination
   */
  static async searchServices(input: ServiceDirectorySearchInput) {
    const {
      search,
      category,
      sector,
      pricingModel,
      minPrice,
      maxPrice,
      state,
      district,
      verifiedOnly,
      page,
      pageSize,
      sortBy,
    } = input;

    const skip = (page - 1) * pageSize;
    const where: Prisma.ServiceListingWhereInput = {
      status: "ACTIVE",
      isAvailable: true,
    };

    // Category filter
    if (category && category !== "ALL") {
      where.category = category as ServiceCategory;
    }

    // Sector filter
    if (sector && sector !== "ALL") {
      where.sector = sector as Sector;
    }

    // Pricing Model filter
    if (pricingModel && pricingModel !== "ALL") {
      where.pricingModel = pricingModel;
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    // Location
    if (state) {
      where.locationState = { equals: state, mode: "insensitive" };
    }
    if (district) {
      where.locationDistrict = { equals: district, mode: "insensitive" };
    }

    // Verified provider filter
    if (verifiedOnly) {
      where.providerProfile = { isVerified: true };
    }

    // Text search across title, description, district, state, and provider name
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { locationDistrict: { contains: search, mode: "insensitive" } },
        { locationState: { contains: search, mode: "insensitive" } },
        { providerProfile: { businessName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Sort order
    let orderBy: Prisma.ServiceListingOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "price_asc") {
      orderBy = { basePrice: "asc" };
    } else if (sortBy === "price_desc") {
      orderBy = { basePrice: "desc" };
    }

    const [services, total] = await Promise.all([
      prisma.serviceListing.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          providerProfile: {
            select: {
              id: true,
              userId: true,
              businessName: true,
              isVerified: true,
            },
          },
        },
      }),
      prisma.serviceListing.count({ where }),
    ]);

    const formatted = services.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      sector: s.sector,
      pricingModel: s.pricingModel,
      basePrice: s.basePrice.toNumber(),
      coverImageUrl: s.coverImageUrl,
      serviceArea: s.serviceArea || "District-wide",
      locationDistrict: s.locationDistrict || "Regional",
      locationState: s.locationState || "India",
      isAvailable: s.isAvailable,
      provider: {
        id: s.providerProfile.id,
        userId: s.providerProfile.userId,
        businessName: s.providerProfile.businessName,
        isVerified: s.providerProfile.isVerified,
      },
      createdAt: s.createdAt,
    }));

    return {
      items: formatted,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Get single service detail with provider credentials
   */
  static async getServiceDetails(id: string) {
    const service = await prisma.serviceListing.findUnique({
      where: { id },
      include: {
        providerProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
            address: true,
          },
        },
      },
    });

    if (!service) {
      throw AppError.notFound("Service listing not found");
    }

    return {
      id: service.id,
      title: service.title,
      description: service.description,
      category: service.category,
      sector: service.sector,
      pricingModel: service.pricingModel,
      basePrice: service.basePrice.toNumber(),
      coverImageUrl: service.coverImageUrl,
      serviceArea: service.serviceArea || "District & State Coverage",
      locationDistrict: service.locationDistrict,
      locationState: service.locationState,
      status: service.status,
      isAvailable: service.isAvailable,
      provider: {
        id: service.providerProfile.id,
        userId: service.providerProfile.userId,
        businessName: service.providerProfile.businessName,
        description: service.providerProfile.description,
        isVerified: service.providerProfile.isVerified,
        experienceYears: service.providerProfile.experienceYears,
        location: service.providerProfile.address
          ? `${service.providerProfile.address.cityOrTown}, ${service.providerProfile.address.state}`
          : `${service.locationDistrict}, ${service.locationState}`,
      },
      createdAt: service.createdAt,
    };
  }

  /**
   * Get provider portal dashboard metrics
   */
  static async getProviderDashboard(userId: string) {
    let profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        services: {
          where: { status: { not: "ARCHIVED" } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw AppError.notFound("User not found");

      profile = await prisma.providerProfile.create({
        data: {
          userId,
          businessName: `${user.fullName} Services`,
          description: "Professional Agricultural & Aquaculture Solutions Provider",
          isVerified: user.status === "ACTIVE",
        },
        include: {
          services: true,
        },
      });
    }

    const serviceIds = profile.services.map((s) => s.id);

    let activeServicesCount = profile.services.filter((s) => s.status === "ACTIVE").length;
    let incomingRequests: any[] = [];
    let pendingQuotations = 0;
    let completedCount = 0;

    try {
      activeServicesCount = await prisma.serviceListing.count({
        where: { providerProfileId: profile.id, status: "ACTIVE" },
      });
    } catch {}

    try {
      if (serviceIds.length > 0) {
        incomingRequests = await prisma.serviceRequest.findMany({
          where: {
            serviceId: { in: serviceIds },
            status: { in: ["OPEN", "QUOTATION_SUBMITTED"] },
          },
          include: {
            service: { select: { title: true, category: true } },
            requester: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });
      }
    } catch {}

    try {
      pendingQuotations = await prisma.serviceQuotation.count({
        where: { providerId: userId, status: "PENDING" },
      });
    } catch {}

    try {
      if (serviceIds.length > 0) {
        completedCount = await prisma.serviceRequest.count({
          where: {
            serviceId: { in: serviceIds },
            status: "COMPLETED",
          },
        });
      }
    } catch {}

    return {
      profile: {
        id: profile.id,
        businessName: profile.businessName,
        description: profile.description,
        isVerified: profile.isVerified,
        experienceYears: profile.experienceYears,
      },
      metrics: {
        activeServicesCount,
        incomingRequestsCount: incomingRequests.length,
        pendingQuotationsCount: pendingQuotations,
        completedServicesCount: completedCount,
      },
      recentRequests: incomingRequests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        serviceTitle: r.service.title,
        category: r.service.category,
        requesterName: r.requester.fullName,
        requiredDate: r.requiredDate,
        quantityOrScale: r.quantityOrScale,
        status: r.status,
        createdAt: r.createdAt,
      })),
      activeServices: profile.services.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        pricingModel: s.pricingModel,
        basePrice: s.basePrice.toNumber(),
        status: s.status,
        isAvailable: s.isAvailable,
      })),
    };
  }

  /**
   * Get all services for the authenticated provider
   */
  static async getProviderServices(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        services: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) return { services: [] };

    return {
      services: profile.services.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        sector: s.sector,
        pricingModel: s.pricingModel,
        basePrice: s.basePrice.toNumber(),
        coverImageUrl: s.coverImageUrl,
        serviceArea: s.serviceArea,
        locationDistrict: s.locationDistrict,
        locationState: s.locationState,
        status: s.status,
        isAvailable: s.isAvailable,
        createdAt: s.createdAt,
      })),
    };
  }

  /**
   * Create a new service listing
   */
  static async createService(userId: string, input: CreateServiceListingInput) {
    let profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw AppError.notFound("User not found");

      profile = await prisma.providerProfile.create({
        data: {
          userId,
          businessName: `${user.fullName} Solutions`,
          isVerified: user.status === "ACTIVE",
        },
      });
    }

    const service = await prisma.$transaction(async (tx) => {
      const s = await tx.serviceListing.create({
        data: {
          providerProfileId: profile!.id,
          title: input.title,
          description: input.description,
          category: input.category,
          sector: input.sector,
          pricingModel: input.pricingModel,
          basePrice: input.basePrice,
          coverImageUrl: input.coverImageUrl || null,
          serviceArea: input.serviceArea || null,
          locationDistrict: input.locationDistrict,
          locationState: input.locationState,
          status: "ACTIVE",
          isAvailable: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SERVICE_CREATED",
          resource: "ServiceListing",
          resourceId: s.id,
          metadata: { title: s.title, category: s.category },
        },
      });

      return s;
    });

    return service;
  }

  /**
   * Update service listing (Provider Ownership Enforced)
   */
  static async updateService(
    userId: string,
    serviceId: string,
    input: UpdateServiceListingInput
  ) {
    const service = await prisma.serviceListing.findUnique({
      where: { id: serviceId },
      include: { providerProfile: true },
    });

    if (!service) throw AppError.notFound("Service listing not found");
    if (service.providerProfile.userId !== userId) {
      throw AppError.forbidden("You do not have permission to modify this service");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.serviceListing.update({
        where: { id: serviceId },
        data: {
          title: input.title,
          description: input.description,
          category: input.category,
          sector: input.sector,
          pricingModel: input.pricingModel,
          basePrice: input.basePrice,
          coverImageUrl: input.coverImageUrl,
          serviceArea: input.serviceArea,
          locationDistrict: input.locationDistrict,
          locationState: input.locationState,
          isAvailable: input.isAvailable,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SERVICE_UPDATED",
          resource: "ServiceListing",
          resourceId: s.id,
        },
      });

      return s;
    });

    return updated;
  }

  /**
   * Pause service listing
   */
  static async pauseService(userId: string, serviceId: string) {
    const service = await prisma.serviceListing.findUnique({
      where: { id: serviceId },
      include: { providerProfile: true },
    });

    if (!service) throw AppError.notFound("Service listing not found");
    if (service.providerProfile.userId !== userId) {
      throw AppError.forbidden("You do not have permission to pause this service");
    }

    return prisma.$transaction(async (tx) => {
      const s = await tx.serviceListing.update({
        where: { id: serviceId },
        data: { status: "PAUSED", isAvailable: false },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SERVICE_PAUSED",
          resource: "ServiceListing",
          resourceId: s.id,
        },
      });

      return s;
    });
  }

  /**
   * Resume service listing
   */
  static async resumeService(userId: string, serviceId: string) {
    const service = await prisma.serviceListing.findUnique({
      where: { id: serviceId },
      include: { providerProfile: true },
    });

    if (!service) throw AppError.notFound("Service listing not found");
    if (service.providerProfile.userId !== userId) {
      throw AppError.forbidden("You do not have permission to resume this service");
    }

    return prisma.$transaction(async (tx) => {
      const s = await tx.serviceListing.update({
        where: { id: serviceId },
        data: { status: "ACTIVE", isAvailable: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SERVICE_RESUMED",
          resource: "ServiceListing",
          resourceId: s.id,
        },
      });

      return s;
    });
  }

  /**
   * Archive service listing
   */
  static async archiveService(userId: string, serviceId: string) {
    const service = await prisma.serviceListing.findUnique({
      where: { id: serviceId },
      include: { providerProfile: true },
    });

    if (!service) throw AppError.notFound("Service listing not found");
    if (service.providerProfile.userId !== userId) {
      throw AppError.forbidden("You do not have permission to archive this service");
    }

    return prisma.$transaction(async (tx) => {
      const s = await tx.serviceListing.update({
        where: { id: serviceId },
        data: { status: "ARCHIVED", isAvailable: false },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SERVICE_ARCHIVED",
          resource: "ServiceListing",
          resourceId: s.id,
        },
      });

      return s;
    });
  }

  /**
   * Create a Service Request (Buyer / Farmer / Network Member)
   */
  static async createServiceRequest(
    requesterId: string,
    input: CreateServiceRequestInput
  ) {
    const service = await prisma.serviceListing.findUnique({
      where: { id: input.serviceId },
      include: { providerProfile: true },
    });

    if (!service || service.status !== "ACTIVE" || !service.isAvailable) {
      throw AppError.businessRule("Selected service is currently inactive or unavailable");
    }

    if (service.providerProfile.userId === requesterId) {
      throw AppError.businessRule("You cannot request your own service listing");
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const requestNumber = `AG-SRV-${dateStr}-${randomSuffix}`;

    const request = await prisma.$transaction(async (tx) => {
      const req = await tx.serviceRequest.create({
        data: {
          requestNumber,
          serviceId: input.serviceId,
          requesterId,
          requiredDate: input.requiredDate,
          quantityOrScale: input.quantityOrScale,
          requirements: input.requirements,
          locationVillageOrStreet: input.locationVillageOrStreet || null,
          locationCityOrTown: input.locationCityOrTown,
          locationDistrict: input.locationDistrict,
          locationState: input.locationState,
          notes: input.notes || null,
          status: "OPEN",
        },
      });

      // Add timeline entry
      await tx.serviceRequestTimeline.create({
        data: {
          serviceRequestId: req.id,
          status: "OPEN",
          note: "Service request submitted by client",
          actorId: requesterId,
        },
      });

      // Notify Provider
      await tx.notification.create({
        data: {
          userId: service.providerProfile.userId,
          type: "SERVICE_UPDATE",
          title: "New Service Request Received",
          body: `New request ${requestNumber} for "${service.title}".`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: requesterId,
          action: "SERVICE_REQUEST_CREATED",
          resource: "ServiceRequest",
          resourceId: req.id,
          metadata: { requestNumber, serviceId: service.id },
        },
      });

      return req;
    });

    return request;
  }

  /**
   * Get user's own service requests (Requester / Buyer view)
   */
  static async getBuyerServiceRequests(requesterId: string) {
    if (!FEATURES.SERVICE_REQUESTS) {
      return {
        isAvailable: false,
        message: "Service Requests are coming soon.",
        requests: [],
      };
    }

    try {
      const requests = await prisma.serviceRequest.findMany({
        where: { requesterId },
        include: {
          service: {
            include: {
              providerProfile: {
                select: { businessName: true, isVerified: true },
              },
            },
          },
          quotations: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        isAvailable: true,
        requests: requests.map((r) => ({
          id: r.id,
          requestNumber: r.requestNumber,
          serviceTitle: r.service.title,
          category: r.service.category,
          providerName: r.service.providerProfile.businessName,
          isProviderVerified: r.service.providerProfile.isVerified,
          requiredDate: r.requiredDate,
          quantityOrScale: r.quantityOrScale,
          status: r.status,
          quotationsCount: r.quotations.length,
          acceptedQuotationId: r.acceptedQuotationId,
          createdAt: r.createdAt,
        })),
      };
    } catch {
      return {
        isAvailable: true,
        requests: [],
      };
    }
  }

  /**
   * Get incoming requests for provider
   */
  static async getProviderIncomingRequests(providerUserId: string) {
    if (!FEATURES.SERVICE_REQUESTS) {
      return { requests: [] };
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: providerUserId },
    });

    if (!profile) return { requests: [] };

    try {
      const requests = await prisma.serviceRequest.findMany({
        where: {
          service: { providerProfileId: profile.id },
        },
        include: {
          service: true,
          requester: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          quotations: {
            where: { providerId: providerUserId },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        requests: requests.map((r) => ({
          id: r.id,
          requestNumber: r.requestNumber,
          serviceTitle: r.service.title,
          category: r.service.category,
          requesterName: r.requester.fullName,
          requiredDate: r.requiredDate,
          quantityOrScale: r.quantityOrScale,
          location: `${r.locationCityOrTown}, ${r.locationDistrict}, ${r.locationState}`,
          status: r.status,
          myQuotation: r.quotations[0]
            ? {
                id: r.quotations[0].id,
                quotationNumber: r.quotations[0].quotationNumber,
                amount: r.quotations[0].amount.toNumber(),
                status: r.quotations[0].status,
                validUntil: r.quotations[0].validUntil,
              }
            : null,
          createdAt: r.createdAt,
        })),
      };
    } catch {
      return { requests: [] };
    }
  }

  /**
   * Get single service request detail with quotations and timeline
   */
  static async getServiceRequestById(userId: string, requestId: string) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        service: {
          include: {
            providerProfile: true,
          },
        },
        requester: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
        },
        timeline: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!request) throw AppError.notFound("Service request not found");

    const isRequester = request.requesterId === userId;
    const isProvider = request.service.providerProfile.userId === userId;

    if (!isRequester && !isProvider) {
      throw AppError.forbidden("You do not have permission to access this service request");
    }

    return {
      id: request.id,
      requestNumber: request.requestNumber,
      serviceId: request.serviceId,
      serviceTitle: request.service.title,
      category: request.service.category,
      pricingModel: request.service.pricingModel,
      basePrice: request.service.basePrice.toNumber(),
      providerBusinessName: request.service.providerProfile.businessName,
      isProviderVerified: request.service.providerProfile.isVerified,
      requesterName: request.requester.fullName,
      requiredDate: request.requiredDate,
      quantityOrScale: request.quantityOrScale,
      requirements: request.requirements,
      location: {
        villageOrStreet: request.locationVillageOrStreet,
        cityOrTown: request.locationCityOrTown,
        district: request.locationDistrict,
        state: request.locationState,
      },
      notes: request.notes,
      status: request.status,
      acceptedQuotationId: request.acceptedQuotationId,
      quotations: request.quotations.map((q) => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        amount: q.amount.toNumber(),
        currency: q.currency,
        validUntil: q.validUntil,
        terms: q.terms,
        notes: q.notes,
        status: q.status,
        createdAt: q.createdAt,
      })),
      timeline: request.timeline.map((t) => ({
        id: t.id,
        status: t.status,
        note: t.note,
        createdAt: t.createdAt,
      })),
      isRequester,
      isProvider,
      createdAt: request.createdAt,
    };
  }

  /**
   * Cancel a Service Request
   */
  static async cancelServiceRequest(
    userId: string,
    requestId: string,
    reason?: string
  ) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { service: { include: { providerProfile: true } } },
    });

    if (!request) throw AppError.notFound("Service request not found");

    const isRequester = request.requesterId === userId;
    const isProvider = request.service.providerProfile.userId === userId;

    if (!isRequester && !isProvider) {
      throw AppError.forbidden("You do not have permission to cancel this request");
    }

    if (request.status === "COMPLETED" || request.status === "CANCELLED") {
      throw AppError.businessRule(`Cannot cancel a request that is already ${request.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED" },
      });

      await tx.serviceRequestTimeline.create({
        data: {
          serviceRequestId: requestId,
          status: "CANCELLED",
          note: reason || `Cancelled by ${isRequester ? "client" : "provider"}`,
          actorId: userId,
        },
      });

      // Notify the counterparty
      const recipientId = isRequester
        ? request.service.providerProfile.userId
        : request.requesterId;

      await tx.notification.create({
        data: {
          userId: recipientId,
          type: "SERVICE_UPDATE",
          title: "Service Request Cancelled",
          body: `Service request ${request.requestNumber} was cancelled.`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SERVICE_REQUEST_CANCELLED",
          resource: "ServiceRequest",
          resourceId: requestId,
          metadata: { reason },
        },
      });

      return updated;
    });
  }

  /**
   * Create a Service Quotation (Provider Only)
   */
  static async createQuotation(
    providerUserId: string,
    input: CreateServiceQuotationInput
  ) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: input.serviceRequestId },
      include: {
        service: { include: { providerProfile: true } },
      },
    });

    if (!request) throw AppError.notFound("Service request not found");

    if (request.service.providerProfile.userId !== providerUserId) {
      throw AppError.forbidden("You are not authorized to quote for this service request");
    }

    if (request.status !== "OPEN" && request.status !== "QUOTATION_SUBMITTED") {
      throw AppError.businessRule(`Cannot submit quote for request in "${request.status}" status`);
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const quotationNumber = `AG-QUO-${dateStr}-${randomSuffix}`;

    const quotation = await prisma.$transaction(async (tx) => {
      const q = await tx.serviceQuotation.create({
        data: {
          quotationNumber,
          serviceRequestId: input.serviceRequestId,
          providerId: providerUserId,
          amount: input.amount,
          validUntil: input.validUntil,
          terms: input.terms || null,
          notes: input.notes || null,
          status: "PENDING",
        },
      });

      // Update request status
      await tx.serviceRequest.update({
        where: { id: input.serviceRequestId },
        data: { status: "QUOTATION_SUBMITTED" },
      });

      // Add timeline entry
      await tx.serviceRequestTimeline.create({
        data: {
          serviceRequestId: input.serviceRequestId,
          status: "QUOTATION_SUBMITTED",
          note: `Quotation ${quotationNumber} submitted for amount ${input.amount}`,
          actorId: providerUserId,
        },
      });

      // Notify Requester
      await tx.notification.create({
        data: {
          userId: request.requesterId,
          type: "SERVICE_UPDATE",
          title: "Service Quotation Received",
          body: `Provider submitted quotation ${quotationNumber} for your request.`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: providerUserId,
          action: "QUOTE_CREATED",
          resource: "ServiceQuotation",
          resourceId: q.id,
          metadata: { quotationNumber, amount: input.amount },
        },
      });

      return q;
    });

    return quotation;
  }

  /**
   * Accept a Quotation (Requester Only)
   */
  static async acceptQuotation(requesterId: string, quotationId: string) {
    const quotation = await prisma.serviceQuotation.findUnique({
      where: { id: quotationId },
      include: {
        serviceRequest: {
          include: {
            service: { include: { providerProfile: true } },
          },
        },
      },
    });

    if (!quotation) throw AppError.notFound("Quotation not found");

    if (quotation.serviceRequest.requesterId !== requesterId) {
      throw AppError.forbidden("You do not have permission to accept this quotation");
    }

    if (quotation.status !== "PENDING") {
      throw AppError.businessRule(`Cannot accept quotation in "${quotation.status}" status`);
    }

    if (new Date(quotation.validUntil) < new Date()) {
      throw AppError.businessRule("This quotation has expired and can no longer be accepted");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Accept this quotation
      const accepted = await tx.serviceQuotation.update({
        where: { id: quotationId },
        data: { status: "ACCEPTED" },
      });

      // 2. Reject other pending quotations for this request
      await tx.serviceQuotation.updateMany({
        where: {
          serviceRequestId: quotation.serviceRequestId,
          id: { not: quotationId },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      // 3. Update ServiceRequest status
      await tx.serviceRequest.update({
        where: { id: quotation.serviceRequestId },
        data: {
          status: "ACCEPTED",
          acceptedQuotationId: quotationId,
        },
      });

      // 4. Timeline
      await tx.serviceRequestTimeline.create({
        data: {
          serviceRequestId: quotation.serviceRequestId,
          status: "ACCEPTED",
          note: `Quotation ${quotation.quotationNumber} accepted by client`,
          actorId: requesterId,
        },
      });

      // 5. Contextual Conversation
      let conversation = await tx.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: requesterId } } },
            { participants: { some: { userId: quotation.providerId } } },
          ],
        },
      });

      if (!conversation) {
        conversation = await tx.conversation.create({
          data: {
            isGroup: false,
            participants: {
              create: [{ userId: requesterId }, { userId: quotation.providerId }],
            },
          },
        });
      }

      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: requesterId,
          content: `Accepted quotation ${quotation.quotationNumber} for service "${quotation.serviceRequest.service.title}".`,
          contextType: "SERVICE",
          contextId: quotation.serviceRequestId,
          contextSnapshot: {
            serviceTitle: quotation.serviceRequest.service.title,
            quotationNumber: quotation.quotationNumber,
            amount: quotation.amount.toNumber(),
          },
        },
      });

      // 6. Notify Provider
      await tx.notification.create({
        data: {
          userId: quotation.providerId,
          type: "SERVICE_UPDATE",
          title: "Service Quotation Accepted",
          body: `Your quotation ${quotation.quotationNumber} has been accepted!`,
        },
      });

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: requesterId,
          action: "QUOTE_ACCEPTED",
          resource: "ServiceQuotation",
          resourceId: quotationId,
        },
      });

      return accepted;
    });

    return result;
  }

  /**
   * Reject a Quotation (Requester Only)
   */
  static async rejectQuotation(requesterId: string, quotationId: string) {
    const quotation = await prisma.serviceQuotation.findUnique({
      where: { id: quotationId },
      include: { serviceRequest: true },
    });

    if (!quotation) throw AppError.notFound("Quotation not found");

    if (quotation.serviceRequest.requesterId !== requesterId) {
      throw AppError.forbidden("You do not have permission to reject this quotation");
    }

    if (quotation.status !== "PENDING") {
      throw AppError.businessRule(`Cannot reject quotation in "${quotation.status}" status`);
    }

    return prisma.$transaction(async (tx) => {
      const rejected = await tx.serviceQuotation.update({
        where: { id: quotationId },
        data: { status: "REJECTED" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: requesterId,
          action: "QUOTE_REJECTED",
          resource: "ServiceQuotation",
          resourceId: quotationId,
        },
      });

      return rejected;
    });
  }

  /**
   * Update Service Execution Status (Provider Only)
   */
  static async updateServiceExecutionStatus(
    providerUserId: string,
    requestId: string,
    input: UpdateServiceExecutionStatusInput
  ) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        service: { include: { providerProfile: true } },
      },
    });

    if (!request) throw AppError.notFound("Service request not found");

    if (request.service.providerProfile.userId !== providerUserId) {
      throw AppError.forbidden("You do not have permission to update execution status");
    }

    // State machine check
    const current = request.status;
    const target = input.status;

    if (current === "COMPLETED" || current === "CANCELLED") {
      throw AppError.businessRule(`Cannot update status from terminal state "${current}"`);
    }

    if (target === "IN_PROGRESS" && current !== "ACCEPTED") {
      throw AppError.businessRule(`Cannot transition to IN_PROGRESS from "${current}". Request must be ACCEPTED first.`);
    }

    if (target === "COMPLETED" && current !== "IN_PROGRESS" && current !== "ACCEPTED") {
      throw AppError.businessRule(`Cannot transition to COMPLETED from "${current}".`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.update({
        where: { id: requestId },
        data: { status: target as ServiceRequestStatus },
      });

      await tx.serviceRequestTimeline.create({
        data: {
          serviceRequestId: requestId,
          status: target as ServiceRequestStatus,
          note: input.note || `Service milestone updated to ${target}`,
          actorId: providerUserId,
        },
      });

      // Notify Requester
      await tx.notification.create({
        data: {
          userId: request.requesterId,
          type: "SERVICE_UPDATE",
          title: `Service Status: ${target}`,
          body: `Your service request ${request.requestNumber} is now ${target}.`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: providerUserId,
          action: "SERVICE_STATUS_UPDATED",
          resource: "ServiceRequest",
          resourceId: requestId,
          metadata: { previousStatus: current, newStatus: target },
        },
      });

      return updated;
    });
  }
}
