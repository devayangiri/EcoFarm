import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProductModerationView } from "@/components/admin/product-moderation-view";

const mockProducts = [
  {
    id: "prod-draft-1",
    title: "Draft Wheat",
    sector: "AGRICULTURE",
    category: "Grains",
    pricePerUnit: 30,
    unit: "KG",
    availableStock: 500,
    status: "DRAFT" as const,
    seller: { id: "seller-1", fullName: "Farmer John", email: "john@example.com" },
    thumbnail: null,
    location: "Kolkata, WB",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-pending-1",
    title: "Pending Rice",
    sector: "AGRICULTURE",
    category: "Grains",
    pricePerUnit: 40,
    unit: "KG",
    availableStock: 1000,
    status: "PENDING_MODERATION" as const,
    seller: { id: "seller-2", fullName: "Farmer Bob", email: "bob@example.com" },
    thumbnail: null,
    location: "Burdwan, WB",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-active-1",
    title: "Active Corn",
    sector: "AGRICULTURE",
    category: "Grains",
    pricePerUnit: 25,
    unit: "KG",
    availableStock: 800,
    status: "ACTIVE" as const,
    seller: { id: "seller-3", fullName: "Farmer Alice", email: "alice@example.com" },
    thumbnail: null,
    location: "Hooghly, WB",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-paused-1",
    title: "Paused Mustard",
    sector: "AGRICULTURE",
    category: "Seeds",
    pricePerUnit: 90,
    unit: "KG",
    availableStock: 200,
    status: "PAUSED" as const,
    seller: { id: "seller-4", fullName: "Farmer Dan", email: "dan@example.com" },
    thumbnail: null,
    location: "Nadia, WB",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-rejected-1",
    title: "Rejected Jute",
    sector: "AGRICULTURE",
    category: "Fibers",
    pricePerUnit: 50,
    unit: "KG",
    availableStock: 100,
    status: "REJECTED" as const,
    seller: { id: "seller-5", fullName: "Farmer Eve", email: "eve@example.com" },
    thumbnail: null,
    location: "Malda, WB",
    createdAt: new Date().toISOString(),
  },
];

describe("Admin Product Moderation View — State Machine and UI Guardrails", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders state-aware action buttons correctly for each lifecycle state", () => {
    render(<ProductModerationView initialProducts={mockProducts} />);

    // DRAFT product: NO Approve/Reject buttons; shows 'Awaiting Seller Submission'
    expect(screen.getByText(/Awaiting Seller Submission/i)).toBeInTheDocument();

    // PENDING_MODERATION product: has Approve and Reject buttons
    expect(screen.getByRole("button", { name: /Approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reject/i })).toBeInTheDocument();

    // ACTIVE product: has Pause button
    expect(screen.getByRole("button", { name: /Pause/i })).toBeInTheDocument();

    // PAUSED product: has Restore button
    expect(screen.getByRole("button", { name: /Restore/i })).toBeInTheDocument();

    // REJECTED product: shows 'Rejected (Awaiting Seller Resubmission)'
    expect(screen.getByText(/Rejected \(Awaiting Seller Resubmission\)/i)).toBeInTheDocument();
  });

  it("filters product list by lifecycle status dropdown", () => {
    render(<ProductModerationView initialProducts={mockProducts} />);

    const select = screen.getByRole("combobox");

    // Select DRAFT filter
    fireEvent.change(select, { target: { value: "DRAFT" } });
    expect(screen.getByText("Draft Wheat")).toBeInTheDocument();
    expect(screen.queryByText("Pending Rice")).not.toBeInTheDocument();
    expect(screen.queryByText("Active Corn")).not.toBeInTheDocument();

    // Select PENDING_MODERATION filter
    fireEvent.change(select, { target: { value: "PENDING_MODERATION" } });
    expect(screen.queryByText("Draft Wheat")).not.toBeInTheDocument();
    expect(screen.getByText("Pending Rice")).toBeInTheDocument();
  });

  it("unmasks real server error message in UI banner when moderation fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Only products in PENDING_MODERATION can be approved. Current status: DRAFT",
        },
      }),
    });

    render(<ProductModerationView initialProducts={mockProducts} />);

    // Click Approve on the pending product
    const approveBtn = screen.getByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtn);

    // Modal opens, click Confirm Action
    const confirmBtn = screen.getByRole("button", { name: /Confirm Action/i });
    fireEvent.click(confirmBtn);

    // Verify the unmasked server error appears in the UI
    await waitFor(() => {
      expect(
        screen.getByText(/Only products in PENDING_MODERATION can be approved\. Current status: DRAFT/i)
      ).toBeInTheDocument();
    });
  });

  it("updates product status and displays success feedback when moderation succeeds", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: "prod-pending-1", status: "ACTIVE" },
        message: "Product approved successfully",
      }),
    });

    render(<ProductModerationView initialProducts={mockProducts} />);

    // Click Approve on pending product
    const approveBtn = screen.getByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtn);

    // Confirm in modal
    const confirmBtn = screen.getByRole("button", { name: /Confirm Action/i });
    fireEvent.click(confirmBtn);

    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText(/Product "Pending Rice" approved\./i)).toBeInTheDocument();
    });
  });
});
