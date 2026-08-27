import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";

describe("AppShell Component", () => {
  it("renders header, branding, children, and mobile navigation", () => {
    render(
      <AppShell userRole="FARMER" userName="Ramesh Kumar" currentPath="/">
        <div data-testid="test-content">Dashboard Content</div>
      </AppShell>
    );

    // Verify Brand Logos (Header & Mobile Header)
    const brandTitles = screen.getAllByText(/Agri-Aqua/i);
    expect(brandTitles.length).toBeGreaterThan(0);

    // Verify Main Content Rendering
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();

    // Verify Navigation links (desktop header + mobile bottom nav)
    expect(screen.getAllByText("Marketplace").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Business Network").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Services").length).toBeGreaterThan(0);

    // Verify User Role presentation
    expect(screen.getByText("farmer")).toBeInTheDocument();
  });
});