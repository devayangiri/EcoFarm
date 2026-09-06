import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoleDashboardLayout } from "@/components/layout/role-dashboard-layout";
import { AppShell } from "@/components/layout/app-shell";
import { isNavItemActive } from "@/components/layout/sidebar";

describe("Unified Role Dashboard Layout & Shell Architecture", () => {
  describe("1. Persistent Role Workspaces Rendering & Footer Suppression", () => {
    it("renders AGENT workspace with sidebar and suppresses footer", () => {
      render(
        <RoleDashboardLayout userRole="AGENT" userName="Test Agent" currentPath="/agent">
          <div data-testid="agent-content">Agent Portal Content</div>
        </RoleDashboardLayout>
      );

      // Verify content renders
      expect(screen.getByTestId("agent-content")).toBeInTheDocument();

      // Verify Agent sidebar items render
      expect(screen.getAllByText("Producer Leads").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Field Tasks").length).toBeGreaterThan(0);
      expect(screen.getAllByText("KYC Verification").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Performance").length).toBeGreaterThan(0);

      // Verify Role badge
      expect(screen.getAllByText("AGENT").length).toBeGreaterThan(0);

      // Verify public marketing footer is suppressed
      expect(screen.queryByText(/EcoFarm Network \| All rights reserved/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/B2B Agricultural & Aquaculture/i)).not.toBeInTheDocument();
    });

    it("renders BUYER workspace with sidebar and suppresses footer", () => {
      render(
        <RoleDashboardLayout userRole="BUYER" userName="Test Buyer" currentPath="/buyer">
          <div data-testid="buyer-content">Buyer Portal Content</div>
        </RoleDashboardLayout>
      );

      expect(screen.getByTestId("buyer-content")).toBeInTheDocument();
      expect(screen.getAllByText("Saved Listings").length).toBeGreaterThan(0);
      expect(screen.getAllByText("My Orders").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Requirements").length).toBeGreaterThan(0);
      expect(screen.queryByText(/EcoFarm Network \| All rights reserved/i)).not.toBeInTheDocument();
    });

    it("renders SERVICE_PROVIDER workspace with sidebar and suppresses footer", () => {
      render(
        <RoleDashboardLayout userRole="SERVICE_PROVIDER" userName="Test Provider" currentPath="/provider">
          <div data-testid="provider-content">Provider Content</div>
        </RoleDashboardLayout>
      );

      expect(screen.getByTestId("provider-content")).toBeInTheDocument();
      expect(screen.getAllByText("My Services").length).toBeGreaterThan(0);
      expect(screen.queryByText(/EcoFarm Network \| All rights reserved/i)).not.toBeInTheDocument();
    });

    it("renders FARMER workspace with sidebar and suppresses footer", () => {
      render(
        <RoleDashboardLayout userRole="FARMER" userName="Test Farmer" currentPath="/farmer">
          <div data-testid="farmer-content">Farmer Content</div>
        </RoleDashboardLayout>
      );

      expect(screen.getByTestId("farmer-content")).toBeInTheDocument();
      expect(screen.getAllByText("Products / Listings").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Manage Farms").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Analytics").length).toBeGreaterThan(0);
      expect(screen.queryByText(/EcoFarm Network \| All rights reserved/i)).not.toBeInTheDocument();
    });
  });

  describe("2. ShellContext Defensive Guardrail Against Duplicate Shells", () => {
    it("safely unwraps nested AppShell without duplicating headers, sidebars, or wrappers", () => {
      render(
        <RoleDashboardLayout userRole="AGENT" userName="Agent Officer" currentPath="/agent/verification">
          {/* Simulate a legacy or child page that also invokes AppShell */}
          <AppShell userRole="AGENT" userName="Agent Officer" currentPath="/agent/verification">
            <div data-testid="nested-page-content">Child Verification Page Content</div>
          </AppShell>
        </RoleDashboardLayout>
      );

      // Child content must render cleanly
      expect(screen.getByTestId("nested-page-content")).toBeInTheDocument();

      // Only ONE sidebar Portal badge should exist in the DOM
      const portalBadges = screen.getAllByText("Portal");
      expect(portalBadges.length).toBe(1);

      // Only ONE desktop header brand link should exist
      const brandLogos = screen.getAllByText(/EcoFarm/i);
      // Header and MobileHeader exist, but no double sets from nested AppShell
      expect(brandLogos.length).toBeLessThanOrEqual(4);
    });
  });

  describe("3. Active Subroute Highlighting Across All Roles", () => {
    it("highlights parent link on child subroutes across all role workspaces", () => {
      // Agent subroutes
      expect(isNavItemActive("/agent/verification", "/agent/verification")).toBe(true);
      expect(isNavItemActive("/agent/verification/case-123", "/agent/verification")).toBe(true);
      expect(isNavItemActive("/agent/leads/lead-999", "/agent/leads")).toBe(true);
      expect(isNavItemActive("/agent/tasks/task-456", "/agent/tasks")).toBe(true);
      expect(isNavItemActive("/agent/farmers/farmer-789", "/agent/farmers")).toBe(true);

      // Buyer subroutes
      expect(isNavItemActive("/buyer/orders", "/buyer/orders")).toBe(true);
      expect(isNavItemActive("/buyer/orders/order-uuid", "/buyer/orders")).toBe(true);
      expect(isNavItemActive("/buyer/services/req-1", "/buyer/services")).toBe(true);
      expect(isNavItemActive("/buyer/requirements/new", "/buyer/requirements")).toBe(true);

      // Provider subroutes
      expect(isNavItemActive("/provider/services", "/provider/services")).toBe(true);
      expect(isNavItemActive("/provider/services/new", "/provider/services")).toBe(true);

      // Farmer subroutes
      expect(isNavItemActive("/farmer/products/new", "/farmer/products")).toBe(true);
      expect(isNavItemActive("/farmer/farms/new", "/farmer/farms")).toBe(true);
    });
  });
});
