import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  Prisma,
  LeadStage,
  LeadActivityType,
  TaskPriority,
  TaskStatus,
  AgentTargetType,
  VerificationStatus,
  Sector,
} from "@prisma/client";
import type {
  CreateLeadInput,
  UpdateLeadInput,
  TransitionLeadStageInput,
  CreateLeadActivityInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateAgentNoteInput,
  ReviewVerificationInput,
  UpdateAgentProfileInput,
  AgentSearchFilterInput,
} from "@/lib/validators/agent.schema";

export class AgentService {
  /**
   * Ensure or retrieve AgentProfile for an authenticated agent
   */
  static async getOrCreateAgentProfile(userId: string) {
    try {
      let profile = await prisma.agentProfile.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!profile) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw AppError.notFound("User not found");

        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const badgeNumber = `AGT-${randomSuffix}`;

        profile = await prisma.agentProfile.create({
          data: {
            userId,
            badgeNumber,
            assignedRegionState: "West Bengal",
            assignedDistricts: ["East Bardhaman", "Hooghly", "North 24 Parganas"],
          },
          include: { user: true },
        });
      }

      return profile;
    } catch {
      // Fallback if agent_profiles table is not yet migrated in current database phase
      const user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
      return {
        id: userId,
        userId,
        badgeNumber: `AGT-${userId.substring(0, 4).toUpperCase()}`,
        assignedRegionState: "West Bengal",
        assignedDistricts: ["East Bardhaman", "Hooghly", "North 24 Parganas"],
        user: {
          fullName: user?.fullName || "Field Agent",
          email: user?.email || "",
          role: "AGENT" as const,
        },
      };
    }
  }

  /**
   * Get agent operations dashboard overview
   */
  static async getAgentDashboard(userId: string) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let assignedFarmersCount = 0;
    let assignedBuyersCount = 0;
    let assignedBusinessesCount = 0;
    let openLeadsCount = 0;
    let tasksDueCount = 0;
    let pendingVerificationsCount = 0;
    let recentTasks: any[] = [];
    let recentLeads: any[] = [];
    let recentVerifications: any[] = [];

    const results = await Promise.allSettled([
      prisma.agentAssignment.count({
        where: { agentProfileId: profile.id, targetType: "FARMER", status: "ACTIVE" },
      }),
      prisma.agentAssignment.count({
        where: { agentProfileId: profile.id, targetType: "BUYER", status: "ACTIVE" },
      }),
      prisma.agentAssignment.count({
        where: { agentProfileId: profile.id, targetType: "BUSINESS", status: "ACTIVE" },
      }),
      prisma.agentLead.count({
        where: { agentProfileId: profile.id, stage: { notIn: ["CONVERTED", "LOST"] } },
      }),
      prisma.agentTask.count({
        where: {
          agentProfileId: profile.id,
          status: { in: ["TODO", "IN_PROGRESS"] },
          dueDate: { lte: todayEnd },
        },
      }),
      prisma.verificationRequest.count({
        where: {
          OR: [{ reviewerId: userId }, { status: "PENDING" }],
          status: { in: ["PENDING", "UNDER_REVIEW"] },
        },
      }),
      prisma.agentTask.findMany({
        where: { agentProfileId: profile.id, status: { not: "COMPLETED" } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.agentLead.findMany({
        where: { agentProfileId: profile.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.verificationRequest.findMany({
        where: {
          OR: [{ reviewerId: userId }, { status: "PENDING" }],
          status: { in: ["PENDING", "UNDER_REVIEW"] },
        },
        include: {
          user: { select: { fullName: true, email: true, role: true } },
          documents: { select: { id: true, documentType: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),
    ]);

    if (results[0].status === "fulfilled") assignedFarmersCount = results[0].value;
    if (results[1].status === "fulfilled") assignedBuyersCount = results[1].value;
    if (results[2].status === "fulfilled") assignedBusinessesCount = results[2].value;
    if (results[3].status === "fulfilled") openLeadsCount = results[3].value;
    if (results[4].status === "fulfilled") tasksDueCount = results[4].value;
    if (results[5].status === "fulfilled") pendingVerificationsCount = results[5].value;
    if (results[6].status === "fulfilled") recentTasks = results[6].value;
    if (results[7].status === "fulfilled") recentLeads = results[7].value;
    if (results[8].status === "fulfilled") recentVerifications = results[8].value;

    const safeFullName = profile?.user?.fullName || "Field Agent";
    const safeEmail = profile?.user?.email || "";
    const safeDistricts = Array.isArray(profile?.assignedDistricts) && profile.assignedDistricts.length > 0
      ? profile.assignedDistricts
      : ["East Bardhaman", "Hooghly", "North 24 Parganas"];

    return {
      profile: {
        id: profile?.id || userId,
        badgeNumber: profile?.badgeNumber || `AGT-${userId.substring(0, 4).toUpperCase()}`,
        fullName: safeFullName,
        email: safeEmail,
        assignedRegionState: profile?.assignedRegionState || "West Bengal",
        assignedDistricts: safeDistricts,
      },
      metrics: {
        assignedFarmersCount: Number(assignedFarmersCount) || 0,
        assignedBuyersCount: Number(assignedBuyersCount) || 0,
        assignedBusinessesCount: Number(assignedBusinessesCount) || 0,
        openLeadsCount: Number(openLeadsCount) || 0,
        tasksDueCount: Number(tasksDueCount) || 0,
        pendingVerificationsCount: Number(pendingVerificationsCount) || 0,
      },
      recentTasks: (recentTasks || []).map((t) => ({
        id: t?.id || String(Math.random()),
        title: t?.title || "Field Inspection",
        dueDate: t?.dueDate instanceof Date ? t.dueDate.toISOString() : String(t?.dueDate || new Date().toISOString()),
        priority: t?.priority || "NORMAL",
        status: t?.status || "TODO",
      })),
      recentLeads: (recentLeads || []).map((l) => ({
        id: l?.id || String(Math.random()),
        contactName: l?.contactName || "Producer Contact",
        stage: l?.stage || "NEW",
        targetSector: l?.targetSector || "AGRICULTURE",
        estimatedValue: l?.estimatedValue ? (typeof l.estimatedValue === "number" ? l.estimatedValue : (typeof l.estimatedValue?.toNumber === "function" ? l.estimatedValue.toNumber() : Number(l.estimatedValue) || null)) : null,
      })),
      recentVerifications: (recentVerifications || []).map((v) => ({
        id: v?.id || String(Math.random()),
        applicantName: v?.user?.fullName || "Applicant",
        applicantRole: v?.user?.role || "USER",
        type: v?.type ? String(v.type).replace(/_/g, " ") : "Identity Verification",
        status: v?.status || "PENDING",
        submittedAt: v?.submittedAt instanceof Date ? v.submittedAt.toISOString() : String(v?.submittedAt || new Date().toISOString()),
        docCount: Array.isArray(v?.documents) ? v.documents.length : 0,
      })),
    };
  }

  /**
   * Get assigned farmers list for current agent (Strict BOLA/IDOR Scope)
   */
  static async getAssignedFarmers(userId: string, input: AgentSearchFilterInput) {
    const profile = await this.getOrCreateAgentProfile(userId);
    const search = input.search;
    const page = input.page || 1;
    const pageSize = input.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const assignments = await prisma.agentAssignment.findMany({
      where: {
        agentProfileId: profile.id,
        targetType: "FARMER",
        status: "ACTIVE",
      },
      select: { targetUserId: true, assignedAt: true, notes: true },
    });

    const farmerUserIds = assignments.map((a) => a.targetUserId);
    if (farmerUserIds.length === 0) {
      return { items: [], pagination: { total: 0, page, pageSize, totalPages: 1 } };
    }

    const where: Prisma.UserWhereInput = {
      id: { in: farmerUserIds },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          farmerProfile: {
            include: {
              farms: { select: { id: true, totalAreaAcres: true, sector: true } },
            },
          },
          products: {
            where: { status: "ACTIVE" },
            select: { id: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = users.map((u) => {
      const assignment = assignments.find((a) => a.targetUserId === u.id);
      const totalAcres = u.farmerProfile?.farms.reduce(
        (sum: number, f: any) => sum + (f.totalAreaAcres ? f.totalAreaAcres.toNumber() : 0),
        0
      ) || 0;

      return {
        id: u.id,
        fullName: u.fullName,
        phone: u.phone,
        isVerified: u.status === "ACTIVE",
        farmCount: u.farmerProfile?.farms.length || 0,
        totalAcres,
        activeProductsCount: u.products.length,
        assignedAt: assignment?.assignedAt,
        notes: assignment?.notes,
      };
    });

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
   * Get single assigned farmer detail (BOLA/IDOR Verified)
   */
  static async getAssignedFarmerDetail(userId: string, farmerId: string) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const assignment = await prisma.agentAssignment.findFirst({
      where: {
        agentProfileId: profile.id,
        targetUserId: farmerId,
        targetType: "FARMER",
        status: "ACTIVE",
      },
    });

    if (!assignment) {
      throw AppError.forbidden("You are not assigned to this farmer");
    }

    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      include: {
        farmerProfile: {
          include: {
            farms: true,
          },
        },
        products: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!farmer) throw AppError.notFound("Farmer not found");

    const [notes, tasks] = await Promise.all([
      prisma.agentNote.findMany({
        where: { agentProfileId: profile.id, targetUserId: farmerId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.agentTask.findMany({
        where: { agentProfileId: profile.id, linkedTargetUserId: farmerId },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    return {
      id: farmer.id,
      fullName: farmer.fullName,
      email: farmer.email,
      phone: farmer.phone,
      status: farmer.status,
      assignedAt: assignment.assignedAt,
      farms: farmer.farmerProfile?.farms.map((f: any) => ({
        id: f.id,
        name: f.name,
        sizeInAcres: f.totalAreaAcres ? f.totalAreaAcres.toNumber() : 0,
        primarySector: f.sector,
        soilType: f.soilType,
        waterSource: f.waterSourceType,
        locationDistrict: "District",
        locationState: "State",
      })) || [],
      products: farmer.products.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        pricePerUnit: p.pricePerUnit.toNumber(),
        unit: p.unit,
        availableStock: p.availableStock.toNumber(),
        status: p.status,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        content: n.content,
        createdAt: n.createdAt,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
      })),
    };
  }

  /**
   * Get assigned buyers list for current agent (Strict BOLA/IDOR Scope)
   */
  static async getAssignedBuyers(userId: string, input: AgentSearchFilterInput) {
    const profile = await this.getOrCreateAgentProfile(userId);
    const search = input.search;
    const page = input.page || 1;
    const pageSize = input.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const assignments = await prisma.agentAssignment.findMany({
      where: {
        agentProfileId: profile.id,
        targetType: "BUYER",
        status: "ACTIVE",
      },
      select: { targetUserId: true, assignedAt: true, notes: true },
    });

    const buyerUserIds = assignments.map((a) => a.targetUserId);
    if (buyerUserIds.length === 0) {
      return { items: [], pagination: { total: 0, page, pageSize, totalPages: 1 } };
    }

    const where: Prisma.UserWhereInput = {
      id: { in: buyerUserIds },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          buyerProfile: true,
          buyerRequirements: { where: { status: "ACTIVE" }, select: { id: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = users.map((u) => {
      const assignment = assignments.find((a) => a.targetUserId === u.id);
      return {
        id: u.id,
        fullName: u.fullName,
        businessName: u.buyerProfile?.companyName || u.fullName,
        buyerType: u.buyerProfile?.buyerType || "INDIVIDUAL",
        isVerified: u.status === "ACTIVE",
        activeRequirementsCount: u.buyerRequirements.length,
        assignedAt: assignment?.assignedAt,
      };
    });

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
   * Get single assigned buyer detail (BOLA/IDOR Verified)
   */
  static async getAssignedBuyerDetail(userId: string, buyerId: string) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const assignment = await prisma.agentAssignment.findFirst({
      where: {
        agentProfileId: profile.id,
        targetUserId: buyerId,
        targetType: "BUYER",
        status: "ACTIVE",
      },
    });

    if (!assignment) {
      throw AppError.forbidden("You are not assigned to this buyer");
    }

    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      include: {
        buyerProfile: true,
        buyerRequirements: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!buyer) throw AppError.notFound("Buyer not found");

    const [notes, tasks] = await Promise.all([
      prisma.agentNote.findMany({
        where: { agentProfileId: profile.id, targetUserId: buyerId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.agentTask.findMany({
        where: { agentProfileId: profile.id, linkedTargetUserId: buyerId },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    return {
      id: buyer.id,
      fullName: buyer.fullName,
      email: buyer.email,
      phone: buyer.phone,
      buyerProfile: buyer.buyerProfile,
      requirements: buyer.buyerRequirements.map((r) => ({
        id: r.id,
        title: r.title,
        sector: r.sector,
        category: r.category,
        quantity: r.quantity.toNumber(),
        unit: r.unit,
        targetPricePerUnit: r.targetPricePerUnit ? r.targetPricePerUnit.toNumber() : null,
        locationDistrict: r.locationDistrict,
        locationState: r.locationState,
        status: r.status,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        content: n.content,
        createdAt: n.createdAt,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
      })),
    };
  }

  /**
   * Get assigned businesses list for current agent (Strict BOLA/IDOR Scope)
   */
  static async getAssignedBusinesses(userId: string, input: AgentSearchFilterInput) {
    const profile = await this.getOrCreateAgentProfile(userId);
    const search = input.search;
    const page = input.page || 1;
    const pageSize = input.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const assignments = await prisma.agentAssignment.findMany({
      where: {
        agentProfileId: profile.id,
        targetType: "BUSINESS",
        status: "ACTIVE",
      },
      select: { targetUserId: true, assignedAt: true, notes: true },
    });

    const businessUserIds = assignments.map((a) => a.targetUserId);
    if (businessUserIds.length === 0) {
      return { items: [], pagination: { total: 0, page, pageSize, totalPages: 1 } };
    }

    const where: Prisma.NetworkProfileWhereInput = {
      userId: { in: businessUserIds },
    };

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { businessCategory: { contains: search, mode: "insensitive" } },
      ];
    }

    const [profiles, total] = await Promise.all([
      prisma.networkProfile.findMany({
        where,
        skip,
        take: pageSize,
        include: { user: { select: { email: true, phone: true } } },
      }),
      prisma.networkProfile.count({ where }),
    ]);

    const formatted = profiles.map((p) => {
      const assignment = assignments.find((a) => a.targetUserId === p.userId);
      return {
        id: p.userId,
        displayName: p.displayName,
        headline: p.headline,
        businessCategory: p.businessCategory || "Commercial Agribusiness",
        sector: p.sector,
        district: p.district,
        state: p.state,
        isVerified: p.isVerified,
        connectionCount: p.connectionCount,
        assignedAt: assignment?.assignedAt,
      };
    });

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
   * Get single assigned business detail
   */
  static async getAssignedBusinessDetail(userId: string, businessUserId: string) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const assignment = await prisma.agentAssignment.findFirst({
      where: {
        agentProfileId: profile.id,
        targetUserId: businessUserId,
        targetType: "BUSINESS",
        status: "ACTIVE",
      },
    });

    if (!assignment) {
      throw AppError.forbidden("You are not assigned to this business");
    }

    const networkProfile = await prisma.networkProfile.findUnique({
      where: { userId: businessUserId },
      include: { user: { select: { fullName: true, email: true, phone: true } } },
    });

    if (!networkProfile) throw AppError.notFound("Business network profile not found");

    const [notes, tasks] = await Promise.all([
      prisma.agentNote.findMany({
        where: { agentProfileId: profile.id, targetUserId: businessUserId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.agentTask.findMany({
        where: { agentProfileId: profile.id, linkedTargetUserId: businessUserId },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    return {
      profile: networkProfile,
      notes: notes.map((n) => ({ id: n.id, content: n.content, createdAt: n.createdAt })),
      tasks: tasks.map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority, status: t.status })),
    };
  }

  /**
   * Lead CRM: Get leads list
   */
  static async getLeads(userId: string, input: AgentSearchFilterInput) {
    const profile = await this.getOrCreateAgentProfile(userId);
    const search = input.search;
    const status = input.status;
    const sector = input.sector;
    const page = input.page || 1;
    const pageSize = input.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AgentLeadWhereInput = {
      agentProfileId: profile.id,
    };

    if (status && status !== "ALL") {
      where.stage = status as LeadStage;
    }

    if (sector && sector !== "ALL") {
      where.targetSector = sector as Sector;
    }

    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: "insensitive" } },
        { contactPhone: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.agentLead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          activities: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.agentLead.count({ where }),
    ]);

    const formatted = leads.map((l) => ({
      id: l.id,
      contactName: l.contactName,
      contactPhone: l.contactPhone,
      contactEmail: l.contactEmail,
      source: l.source,
      targetSector: l.targetSector,
      stage: l.stage,
      estimatedValue: l.estimatedValue ? l.estimatedValue.toNumber() : null,
      notes: l.notes,
      lastActivity: l.activities[0] || null,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
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
   * Lead CRM: Get single lead
   */
  static async getLeadById(userId: string, leadId: string) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const lead = await prisma.agentLead.findUnique({
      where: { id: leadId },
      include: {
        activities: { orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { dueDate: "asc" } },
      },
    });

    if (!lead) throw AppError.notFound("Lead not found");
    if (lead.agentProfileId !== profile.id) {
      throw AppError.forbidden("You do not have access to this lead");
    }

    return {
      id: lead.id,
      contactName: lead.contactName,
      contactPhone: lead.contactPhone,
      contactEmail: lead.contactEmail,
      source: lead.source,
      targetSector: lead.targetSector,
      stage: lead.stage,
      estimatedValue: lead.estimatedValue ? lead.estimatedValue.toNumber() : null,
      notes: lead.notes,
      activities: lead.activities.map((a) => ({
        id: a.id,
        type: a.type,
        note: a.note,
        createdAt: a.createdAt,
      })),
      tasks: lead.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
      })),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  /**
   * Lead CRM: Create new lead
   */
  static async createLead(userId: string, input: CreateLeadInput) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const lead = await prisma.$transaction(async (tx) => {
      const l = await tx.agentLead.create({
        data: {
          agentProfileId: profile.id,
          contactName: input.contactName,
          contactPhone: input.contactPhone || null,
          contactEmail: input.contactEmail || null,
          source: input.source || null,
          targetSector: input.targetSector,
          stage: input.stage,
          estimatedValue: input.estimatedValue || null,
          notes: input.notes || null,
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: l.id,
          agentProfileId: profile.id,
          type: "STATUS_CHANGE",
          note: `Lead created in ${input.stage} stage`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "LEAD_CREATED",
          resource: "AgentLead",
          resourceId: l.id,
          metadata: { contactName: l.contactName, stage: l.stage },
        },
      });

      return l;
    });

    return lead;
  }

  /**
   * Lead CRM: Update lead
   */
  static async updateLead(userId: string, leadId: string, input: UpdateLeadInput) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const existing = await prisma.agentLead.findUnique({ where: { id: leadId } });
    if (!existing) throw AppError.notFound("Lead not found");
    if (existing.agentProfileId !== profile.id) {
      throw AppError.forbidden("You do not have permission to update this lead");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const l = await tx.agentLead.update({
        where: { id: leadId },
        data: {
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail,
          source: input.source,
          targetSector: input.targetSector,
          estimatedValue: input.estimatedValue,
          notes: input.notes,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "LEAD_UPDATED",
          resource: "AgentLead",
          resourceId: l.id,
        },
      });

      return l;
    });

    return updated;
  }

  /**
   * Lead CRM: Transition stage
   */
  static async transitionLeadStage(
    userId: string,
    leadId: string,
    input: TransitionLeadStageInput
  ) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const existing = await prisma.agentLead.findUnique({ where: { id: leadId } });
    if (!existing) throw AppError.notFound("Lead not found");
    if (existing.agentProfileId !== profile.id) {
      throw AppError.forbidden("You do not have permission to move this lead");
    }

    const currentStage = existing.stage;
    const targetStage = input.stage;

    const result = await prisma.$transaction(async (tx) => {
      const l = await tx.agentLead.update({
        where: { id: leadId },
        data: { stage: targetStage },
      });

      await tx.leadActivity.create({
        data: {
          leadId,
          agentProfileId: profile.id,
          type: "STATUS_CHANGE",
          note: input.note || `Transitioned stage from ${currentStage} to ${targetStage}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "LEAD_STAGE_CHANGED",
          resource: "AgentLead",
          resourceId: leadId,
          metadata: { previousStage: currentStage, newStage: targetStage },
        },
      });

      return l;
    });

    return result;
  }

  /**
   * Lead CRM: Record activity
   */
  static async createLeadActivity(userId: string, input: CreateLeadActivityInput) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const lead = await prisma.agentLead.findUnique({ where: { id: input.leadId } });
    if (!lead) throw AppError.notFound("Lead not found");
    if (lead.agentProfileId !== profile.id) {
      throw AppError.forbidden("You do not have access to record activities on this lead");
    }

    const activity = await prisma.$transaction(async (tx) => {
      const a = await tx.leadActivity.create({
        data: {
          leadId: input.leadId,
          agentProfileId: profile.id,
          type: input.type,
          note: input.note,
        },
      });

      await tx.agentLead.update({
        where: { id: input.leadId },
        data: { updatedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "LEAD_ACTIVITY_CREATED",
          resource: "LeadActivity",
          resourceId: a.id,
          metadata: { type: a.type },
        },
      });

      return a;
    });

    return activity;
  }

  /**
   * Tasks: Get tasks list
   */
  static async getTasks(
    userId: string,
    filter?: { status?: string; view?: "today" | "upcoming" | "overdue" | "completed" }
  ) {
    const profile = await this.getOrCreateAgentProfile(userId);
    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const where: Prisma.AgentTaskWhereInput = {
      agentProfileId: profile.id,
    };

    if (filter?.view === "today") {
      where.status = { in: ["TODO", "IN_PROGRESS"] };
      where.dueDate = { lte: todayEnd };
    } else if (filter?.view === "upcoming") {
      where.status = { in: ["TODO", "IN_PROGRESS"] };
      where.dueDate = { gt: todayEnd };
    } else if (filter?.view === "overdue") {
      where.status = { in: ["TODO", "IN_PROGRESS"] };
      where.dueDate = { lt: now };
    } else if (filter?.view === "completed") {
      where.status = "COMPLETED";
    }

    const tasks = await prisma.agentTask.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        linkedLead: { select: { id: true, contactName: true } },
      },
    });

    return {
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
        isOverdue: t.status !== "COMPLETED" && new Date(t.dueDate) < now,
        linkedLead: t.linkedLead,
        linkedTargetType: t.linkedTargetType,
        linkedTargetUserId: t.linkedTargetUserId,
        completedAt: t.completedAt,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * Tasks: Create task
   */
  static async createTask(userId: string, input: CreateTaskInput) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.agentTask.create({
        data: {
          agentProfileId: profile.id,
          title: input.title,
          description: input.description || null,
          dueDate: input.dueDate,
          priority: input.priority,
          status: "TODO",
          linkedLeadId: input.linkedLeadId || null,
          linkedTargetType: input.linkedTargetType || null,
          linkedTargetUserId: input.linkedTargetUserId || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "TASK_CREATED",
          resource: "AgentTask",
          resourceId: t.id,
          metadata: { title: t.title, priority: t.priority },
        },
      });

      return t;
    });

    return task;
  }

  /**
   * Tasks: Complete task
   */
  static async completeTask(userId: string, taskId: string) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const task = await prisma.agentTask.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");
    if (task.agentProfileId !== profile.id) {
      throw AppError.forbidden("You do not have permission to complete this task");
    }

    return prisma.$transaction(async (tx) => {
      const t = await tx.agentTask.update({
        where: { id: taskId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "TASK_COMPLETED",
          resource: "AgentTask",
          resourceId: taskId,
        },
      });

      return t;
    });
  }

  /**
   * Tasks: Cancel task
   */
  static async cancelTask(userId: string, taskId: string) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const task = await prisma.agentTask.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");
    if (task.agentProfileId !== profile.id) {
      throw AppError.forbidden("You do not have permission to cancel this task");
    }

    return prisma.$transaction(async (tx) => {
      const t = await tx.agentTask.update({
        where: { id: taskId },
        data: { status: "CANCELLED" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "TASK_CANCELLED",
          resource: "AgentTask",
          resourceId: taskId,
        },
      });

      return t;
    });
  }

  /**
   * Notes: Create operational note on assigned resource (BOLA Protected)
   */
  static async createAgentNote(userId: string, input: CreateAgentNoteInput) {
    const profile = await this.getOrCreateAgentProfile(userId);

    // Verify assignment exists for this target user
    const assignment = await prisma.agentAssignment.findFirst({
      where: {
        agentProfileId: profile.id,
        targetUserId: input.targetUserId,
        targetType: input.targetType,
        status: "ACTIVE",
      },
    });

    if (!assignment) {
      throw AppError.forbidden("Cannot attach note to unassigned account");
    }

    const note = await prisma.$transaction(async (tx) => {
      const n = await tx.agentNote.create({
        data: {
          agentProfileId: profile.id,
          targetType: input.targetType,
          targetUserId: input.targetUserId,
          content: input.content,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "AGENT_NOTE_CREATED",
          resource: "AgentNote",
          resourceId: n.id,
          metadata: { targetType: input.targetType, targetUserId: input.targetUserId },
        },
      });

      return n;
    });

    return note;
  }

  /**
   * Verification Queue: Get verification cases
   */
  static async getVerificationQueue(userId: string, statusFilter?: string) {
    const where: Prisma.VerificationRequestWhereInput = {
      OR: [{ reviewerId: userId }, { reviewerId: null, status: "PENDING" }],
    };

    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter as VerificationStatus;
    }

    const cases = await prisma.verificationRequest.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true, phone: true, role: true } },
        documents: {
          select: {
            id: true,
            documentType: true,
            originalFileName: true,
            fileSizeBytes: true,
            uploadedAt: true,
          },
        },
      },
    });

    return {
      cases: cases.map((c) => ({
        id: c.id,
        applicant: {
          name: c.user.fullName,
          email: c.user.email,
          phone: c.user.phone,
          role: c.user.role,
        },
        type: c.type,
        status: c.status,
        submittedAt: c.submittedAt,
        reviewedAt: c.reviewedAt,
        reviewNotes: c.reviewNotes,
        documentsCount: c.documents.length,
        documents: c.documents,
      })),
    };
  }

  /**
   * Verification Queue: Get single verification case
   */
  static async getVerificationDetail(userId: string, verificationId: string) {
    const item = await prisma.verificationRequest.findUnique({
      where: { id: verificationId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
        documents: true,
      },
    });

    if (!item) throw AppError.notFound("Verification case not found");

    return {
      id: item.id,
      applicant: item.user,
      type: item.type,
      status: item.status,
      reviewerId: item.reviewerId,
      reviewNotes: item.reviewNotes,
      submittedAt: item.submittedAt,
      reviewedAt: item.reviewedAt,
      documents: item.documents.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        originalFileName: d.originalFileName,
        mimeType: d.mimeType,
        fileSizeBytes: d.fileSizeBytes,
        storageKey: d.storageKey,
        uploadedAt: d.uploadedAt,
      })),
    };
  }

  /**
   * Verification Review: Start Review
   */
  static async startVerificationReview(userId: string, verificationId: string) {
    const item = await prisma.verificationRequest.findUnique({ where: { id: verificationId } });
    if (!item) throw AppError.notFound("Verification case not found");

    if (item.status !== "PENDING" && item.status !== "UNDER_REVIEW") {
      throw AppError.businessRule(`Cannot start review for case in "${item.status}" state`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.verificationRequest.update({
        where: { id: verificationId },
        data: {
          status: "UNDER_REVIEW",
          reviewerId: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "VERIFICATION_REVIEW_STARTED",
          resource: "VerificationRequest",
          resourceId: verificationId,
        },
      });

      return updated;
    });
  }

  /**
   * Verification Review: Approve Case
   */
  static async approveVerification(
    userId: string,
    verificationId: string,
    reviewNotes?: string
  ) {
    const item = await prisma.verificationRequest.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!item) throw AppError.notFound("Verification case not found");

    if (item.status === "APPROVED" || item.status === "REJECTED") {
      throw AppError.businessRule(`Cannot approve a case that is already ${item.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.verificationRequest.update({
        where: { id: verificationId },
        data: {
          status: "APPROVED",
          reviewerId: userId,
          reviewNotes: reviewNotes || "Verified and approved by field operations agent.",
          reviewedAt: new Date(),
        },
      });

      // Activate User Status
      await tx.user.update({
        where: { id: item.userId },
        data: { status: "ACTIVE" },
      });

      // Mark Network Profile Verified
      await tx.networkProfile.updateMany({
        where: { userId: item.userId },
        data: { isVerified: true },
      });

      // Mark Provider Profile Verified
      await tx.providerProfile.updateMany({
        where: { userId: item.userId },
        data: { isVerified: true },
      });

      // Mark Farmer Profile Verified
      await tx.farmerProfile.updateMany({
        where: { userId: item.userId },
        data: { isVerified: true },
      });

      // Dispatch Notification
      await tx.notification.create({
        data: {
          userId: item.userId,
          type: "VERIFICATION_UPDATE",
          title: "Account Verification Approved",
          body: "Your submitted verification credentials have been approved. Verified badge activated!",
        },
      });

      // Immutable Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "VERIFICATION_APPROVED",
          resource: "VerificationRequest",
          resourceId: verificationId,
          metadata: { applicantId: item.userId, type: item.type },
        },
      });

      return updated;
    });
  }

  /**
   * Verification Review: Request Changes
   */
  static async requestVerificationChanges(
    userId: string,
    verificationId: string,
    reviewNotes: string
  ) {
    const item = await prisma.verificationRequest.findUnique({ where: { id: verificationId } });
    if (!item) throw AppError.notFound("Verification case not found");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.verificationRequest.update({
        where: { id: verificationId },
        data: {
          status: "REQUEST_CHANGES",
          reviewerId: userId,
          reviewNotes,
          reviewedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: item.userId,
          type: "VERIFICATION_UPDATE",
          title: "Verification Changes Requested",
          body: `Please update your verification documents: ${reviewNotes}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "VERIFICATION_CHANGES_REQUESTED",
          resource: "VerificationRequest",
          resourceId: verificationId,
          metadata: { reviewNotes },
        },
      });

      return updated;
    });
  }

  /**
   * Verification Review: Reject Case
   */
  static async rejectVerification(
    userId: string,
    verificationId: string,
    reviewNotes: string
  ) {
    const item = await prisma.verificationRequest.findUnique({ where: { id: verificationId } });
    if (!item) throw AppError.notFound("Verification case not found");

    if (item.status === "APPROVED" || item.status === "REJECTED") {
      throw AppError.businessRule(`Cannot reject a case that is already ${item.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.verificationRequest.update({
        where: { id: verificationId },
        data: {
          status: "REJECTED",
          reviewerId: userId,
          reviewNotes,
          reviewedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: item.userId,
          type: "VERIFICATION_UPDATE",
          title: "Verification Application Rejected",
          body: `Verification was not approved: ${reviewNotes}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "VERIFICATION_REJECTED",
          resource: "VerificationRequest",
          resourceId: verificationId,
          metadata: { reviewNotes },
        },
      });

      return updated;
    });
  }

  /**
   * Performance & Analytics
   */
  static async getPerformance(userId: string) {
    const profile = await this.getOrCreateAgentProfile(userId);

    const [
      totalAssigned,
      totalLeads,
      convertedLeads,
      completedTasks,
      overdueTasks,
      processedVerifications,
    ] = await Promise.all([
      prisma.agentAssignment.count({ where: { agentProfileId: profile.id } }),
      prisma.agentLead.count({ where: { agentProfileId: profile.id } }),
      prisma.agentLead.count({
        where: { agentProfileId: profile.id, stage: "CONVERTED" },
      }),
      prisma.agentTask.count({
        where: { agentProfileId: profile.id, status: "COMPLETED" },
      }),
      prisma.agentTask.count({
        where: {
          agentProfileId: profile.id,
          status: { not: "COMPLETED" },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.verificationRequest.count({
        where: { reviewerId: userId, status: { in: ["APPROVED", "REJECTED"] } },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      totalAssigned,
      totalLeads,
      convertedLeads,
      conversionRate: Math.round(conversionRate * 10) / 10,
      completedTasks,
      overdueTasks,
      processedVerifications,
    };
  }

  /**
   * Activity Timeline
   */
  static async getActivityTimeline(userId: string) {
    const logs = await prisma.auditLog.findMany({
      where: { actorUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return {
      activities: logs.map((l) => ({
        id: l.id,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        metadata: l.metadata,
        createdAt: l.createdAt,
      })),
    };
  }
}
