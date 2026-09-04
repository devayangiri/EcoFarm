import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";
import { AgentDashboardView } from "@/components/agent/agent-dashboard-view";

describe("Agent Dashboard View & AppShell for AGENT", () => {
  it("renders without crashing with full data", () => {
    const data = {
      profile: {
        badgeNumber: "AGT-TEST",
        fullName: "Test Agent",
        email: "agent@test.com",
        assignedRegionState: "West Bengal",
        assignedDistricts: ["East Bardhaman", "Hooghly"],
      },
      metrics: {
        assignedFarmersCount: 5,
        assignedBuyersCount: 3,
        assignedBusinessesCount: 2,
        openLeadsCount: 4,
        tasksDueCount: 1,
        pendingVerificationsCount: 2,
      },
      recentTasks: [
        {
          id: "task-1",
          title: "Farm Inspection",
          dueDate: new Date().toISOString(),
          priority: "HIGH",
          status: "TODO",
        },
      ],
      recentLeads: [
        {
          id: "lead-1",
          contactName: "Biplab Das",
          stage: "CONTACTED",
          targetSector: "AGRICULTURE",
          estimatedValue: 50000,
        },
      ],
      recentVerifications: [
        {
          id: "v-1",
          applicantName: "Suman Roy",
          applicantRole: "FARMER",
          type: "Farm Land Ownership",
          status: "PENDING",
          submittedAt: new Date().toISOString(),
          docCount: 2,
        },
      ],
    };

    render(
      <AppShell
        showSidebar
        currentPath="/agent"
        userRole="AGENT"
        userName="Test Agent"
      >
        <AgentDashboardView data={data} />
      </AppShell>
    );

    expect(screen.getByText("Agent Operations Hub")).toBeInTheDocument();
    expect(screen.getByText("Badge: AGT-TEST")).toBeInTheDocument();
  });

  it("renders with fallback/empty data", () => {
    const data = {
      profile: {
        badgeNumber: "AGT-DEF",
        fullName: "Field Agent",
        email: "",
        assignedRegionState: "West Bengal",
        assignedDistricts: [],
      },
      metrics: {
        assignedFarmersCount: 0,
        assignedBuyersCount: 0,
        assignedBusinessesCount: 0,
        openLeadsCount: 0,
        tasksDueCount: 0,
        pendingVerificationsCount: 0,
      },
      recentTasks: [],
      recentLeads: [],
      recentVerifications: [],
    };

    render(
      <AppShell
        showSidebar
        currentPath="/agent"
        userRole="AGENT"
        userName="Field Agent"
      >
        <AgentDashboardView data={data} />
      </AppShell>
    );

    expect(screen.getByText("Agent Operations Hub")).toBeInTheDocument();
  });
});
