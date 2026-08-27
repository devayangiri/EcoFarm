import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentService } from "@/services/agent.service";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    agentProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    agentAssignment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    agentLead: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    leadActivity: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    agentTask: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    agentNote: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    verificationRequest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    networkProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    farmerProfile: {
      updateMany: vi.fn(),
    },
    providerProfile: {
      updateMany: vi.fn(),
    },
    buyerProfile: {
      updateMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
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

describe("Phase 10: Agent Operations Hub, Assignments, CRM & Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------
  // 1. DASHBOARD & PROFILE
  // ----------------------------------------------------
  describe("1. Agent Dashboard & Metrics", () => {
    it("should compute operational KPIs and return territory summary", async () => {
      (prisma.agentProfile.findUnique as any).mockResolvedValue({
        id: "prof-1",
        userId: "agent-1",
        badgeNumber: "AGT-1001",
        assignedRegionState: "West Bengal",
        assignedDistricts: ["Hooghly", "Bardhaman"],
        user: { fullName: "Subhashis Roy", email: "agent@agri-aqua.in" },
      });

      (prisma.agentAssignment.count as any)
        .mockResolvedValueOnce(5) // farmers
        .mockResolvedValueOnce(3) // buyers
        .mockResolvedValueOnce(2); // businesses

      (prisma.agentLead.count as any).mockResolvedValue(8);
      (prisma.agentTask.count as any).mockResolvedValue(4);
      (prisma.verificationRequest.count as any).mockResolvedValue(2);

      (prisma.agentTask.findMany as any).mockResolvedValue([]);
      (prisma.agentLead.findMany as any).mockResolvedValue([]);
      (prisma.verificationRequest.findMany as any).mockResolvedValue([]);

      const dashboard = await AgentService.getAgentDashboard("agent-1");

      expect(dashboard.profile.badgeNumber).toBe("AGT-1001");
      expect(dashboard.metrics.assignedFarmersCount).toBe(5);
      expect(dashboard.metrics.assignedBuyersCount).toBe(3);
      expect(dashboard.metrics.assignedBusinessesCount).toBe(2);
      expect(dashboard.metrics.openLeadsCount).toBe(8);
      expect(dashboard.metrics.tasksDueCount).toBe(4);
      expect(dashboard.metrics.pendingVerificationsCount).toBe(2);
    });
  });

  // ----------------------------------------------------
  // 2. ASSIGNMENT ISOLATION & BOLA/IDOR SECURITY
  // ----------------------------------------------------
  describe("2. Assigned Account Scoping & Cross-Agent Isolation", () => {
    it("should allow agent to view detail of an assigned farmer", async () => {
      (prisma.agentProfile.findUnique as any).mockResolvedValue({
        id: "prof-1",
        userId: "agent-1",
        user: { fullName: "Agent 1" },
      });

      (prisma.agentAssignment.findFirst as any).mockResolvedValue({
        id: "asgn-1",
        agentProfileId: "prof-1",
        targetUserId: "farmer-1",
        targetType: "FARMER",
        status: "ACTIVE",
        assignedAt: new Date(),
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "farmer-1",
        fullName: "Ratan Ghosh",
        email: "ratan@farmer.in",
        farmerProfile: { farms: [] },
        products: [],
      });

      (prisma.agentNote.findMany as any).mockResolvedValue([]);
      (prisma.agentTask.findMany as any).mockResolvedValue([]);

      const detail = await AgentService.getAssignedFarmerDetail("agent-1", "farmer-1");

      expect(detail.id).toBe("farmer-1");
      expect(detail.fullName).toBe("Ratan Ghosh");
    });

    it("should block agent from accessing an unassigned farmer (IDOR Protection)", async () => {
      (prisma.agentProfile.findUnique as any).mockResolvedValue({
        id: "prof-1",
        userId: "agent-1",
        user: { fullName: "Agent 1" },
      });

      // No active assignment found
      (prisma.agentAssignment.findFirst as any).mockResolvedValue(null);

      await expect(
        AgentService.getAssignedFarmerDetail("agent-1", "farmer-unassigned")
      ).rejects.toThrow(/not assigned/);
    });
  });

  // ----------------------------------------------------
  // 3. LEAD CRM PIPELINE
  // ----------------------------------------------------
  describe("3. Lead CRM Creation, Stage Transitions & Activities", () => {
    it("should create new lead and record initial STATUS_CHANGE activity", async () => {
      (prisma.agentProfile.findUnique as any).mockResolvedValue({
        id: "prof-1",
        userId: "agent-1",
        user: { fullName: "Agent 1" },
      });

      (prisma.agentLead.create as any).mockImplementation(({ data }: any) => ({
        id: "lead-1",
        ...data,
      }));

      const lead = await AgentService.createLead("agent-1", {
        contactName: "Burdwan Fish Hatchery",
        targetSector: "AQUACULTURE",
        stage: "NEW",
        estimatedValue: 350000,
      });

      expect(lead.id).toBe("lead-1");
      expect(lead.contactName).toBe("Burdwan Fish Hatchery");
      expect(prisma.leadActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: "lead-1",
            type: "STATUS_CHANGE",
          }),
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "LEAD_CREATED",
          }),
        })
      );
    });

    it("should transition lead stage and record activity", async () => {
      (prisma.agentProfile.findUnique as any).mockResolvedValue({
        id: "prof-1",
        userId: "agent-1",
        user: { fullName: "Agent 1" },
      });

      (prisma.agentLead.findUnique as any).mockResolvedValue({
        id: "lead-1",
        agentProfileId: "prof-1",
        stage: "NEW",
      });

      (prisma.agentLead.update as any).mockResolvedValue({
        id: "lead-1",
        stage: "CONTACTED",
      });

      const updated = await AgentService.transitionLeadStage("agent-1", "lead-1", {
        stage: "CONTACTED",
        note: "Called owner regarding feed requirements",
      });

      expect(updated.stage).toBe("CONTACTED");
      expect(prisma.leadActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "STATUS_CHANGE",
          }),
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "LEAD_STAGE_CHANGED",
          }),
        })
      );
    });

    it("should block Agent A from modifying Agent B's lead", async () => {
      (prisma.agentProfile.findUnique as any).mockResolvedValue({
        id: "prof-agent-A",
        userId: "agent-A",
        user: { fullName: "Agent A" },
      });

      (prisma.agentLead.findUnique as any).mockResolvedValue({
        id: "lead-B",
        agentProfileId: "prof-agent-B", // belongs to Agent B
      });

      await expect(
        AgentService.transitionLeadStage("agent-A", "lead-B", { stage: "QUALIFIED" })
      ).rejects.toThrow(/permission/);
    });
  });

  // ----------------------------------------------------
  // 4. TASK MANAGEMENT
  // ----------------------------------------------------
  describe("4. Task Creation, Completion & Ownership", () => {
    it("should create operational task with priority", async () => {
      (prisma.agentProfile.findUnique as any).mockResolvedValue({
        id: "prof-1",
        userId: "agent-1",
        user: { fullName: "Agent 1" },
      });

      (prisma.agentTask.create as any).mockImplementation(({ data }: any) => ({
        id: "task-1",
        ...data,
      }));

      const task = await AgentService.createTask("agent-1", {
        title: "Visit Hooghly cold chain facility",
        dueDate: new Date(Date.now() + 86400000),
        priority: "HIGH",
      });

      expect(task.id).toBe("task-1");
      expect(task.priority).toBe("HIGH");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "TASK_CREATED",
          }),
        })
      );
    });

    it("should complete task and record completion timestamp", async () => {
      (prisma.agentProfile.findUnique as any).mockResolvedValue({
        id: "prof-1",
        userId: "agent-1",
        user: { fullName: "Agent 1" },
      });

      (prisma.agentTask.findUnique as any).mockResolvedValue({
        id: "task-1",
        agentProfileId: "prof-1",
        status: "TODO",
      });

      (prisma.agentTask.update as any).mockResolvedValue({
        id: "task-1",
        status: "COMPLETED",
        completedAt: new Date(),
      });

      const completed = await AgentService.completeTask("agent-1", "task-1");

      expect(completed.status).toBe("COMPLETED");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "TASK_COMPLETED",
          }),
        })
      );
    });
  });

  // ----------------------------------------------------
  // 5. VERIFICATION REVIEW WORKFLOW
  // ----------------------------------------------------
  describe("5. Verification Review, Approval & State Lock", () => {
    it("should approve valid verification case, activate user and trigger notification", async () => {
      (prisma.verificationRequest.findUnique as any).mockResolvedValue({
        id: "ver-1",
        userId: "user-farmer-1",
        type: "FARMER_LAND",
        status: "PENDING",
      });

      (prisma.verificationRequest.update as any).mockResolvedValue({
        id: "ver-1",
        status: "APPROVED",
      });

      const approved = await AgentService.approveVerification(
        "agent-1",
        "ver-1",
        "Title deed verified against Land Records portal"
      );

      expect(approved.status).toBe("APPROVED");
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-farmer-1" },
          data: { status: "ACTIVE" },
        })
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-farmer-1",
            type: "VERIFICATION_UPDATE",
          }),
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "VERIFICATION_APPROVED",
          }),
        })
      );
    });

    it("should prevent approving an already approved or rejected verification case", async () => {
      (prisma.verificationRequest.findUnique as any).mockResolvedValue({
        id: "ver-closed",
        status: "APPROVED",
      });

      await expect(
        AgentService.approveVerification("agent-1", "ver-closed")
      ).rejects.toThrow(/already APPROVED/);
    });
  });

  // ----------------------------------------------------
  // 6. PERFORMANCE METRICS
  // ----------------------------------------------------
  describe("6. Performance Analytics Computation", () => {
    it("should calculate conversion rate without division by zero", async () => {
      (prisma.agentProfile.findUnique as any).mockResolvedValue({
        id: "prof-1",
        userId: "agent-1",
        user: { fullName: "Agent 1" },
      });

      (prisma.agentAssignment.count as any).mockResolvedValue(10);
      (prisma.agentLead.count as any)
        .mockResolvedValueOnce(20) // totalLeads
        .mockResolvedValueOnce(5); // convertedLeads
      (prisma.agentTask.count as any)
        .mockResolvedValueOnce(15) // completedTasks
        .mockResolvedValueOnce(2); // overdueTasks
      (prisma.verificationRequest.count as any).mockResolvedValue(8);

      const perf = await AgentService.getPerformance("agent-1");

      expect(perf.totalAssigned).toBe(10);
      expect(perf.totalLeads).toBe(20);
      expect(perf.convertedLeads).toBe(5);
      expect(perf.conversionRate).toBe(25); // (5 / 20) * 100
      expect(perf.completedTasks).toBe(15);
      expect(perf.processedVerifications).toBe(8);
    });
  });
});
