import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Tabs } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/cards/product-card";
import { StatCard } from "@/components/cards/stat-card";
import { Sprout, Users } from "lucide-react";

describe("Phase 4: Stitch UI Components Test Suite", () => {
  describe("1. Button Component", () => {
    it("should render button with text and handle click events", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Submit Order</Button>);

      const button = screen.getByRole("button", { name: /Submit Order/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should disable click and show loading spinner when isLoading=true", () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Save Changes
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("2. Badge Component", () => {
    it("should render status badge with correct text", () => {
      render(<Badge variant="success">Verified Producer</Badge>);
      expect(screen.getByText(/Verified Producer/i)).toBeInTheDocument();
    });

    it("should render status badge with dot indicator", () => {
      render(
        <Badge variant="warning" dot>
          Pending Review
        </Badge>
      );
      expect(screen.getByText(/Pending Review/i)).toBeInTheDocument();
    });
  });

  describe("3. FormField & Input Components", () => {
    it("should render FormField with label, input, and error message", () => {
      render(
        <FormField label="Harvest Quantity" required error="Quantity cannot be negative">
          <Input placeholder="Enter quintals" isError />
        </FormField>
      );

      expect(screen.getByText(/Harvest Quantity/i)).toBeInTheDocument();
      expect(screen.getByText(/\*/i)).toBeInTheDocument(); // Required asterisk
      expect(screen.getByPlaceholderText(/Enter quintals/i)).toBeInTheDocument();
      expect(screen.getByText(/Quantity cannot be negative/i)).toBeInTheDocument();
    });
  });

  describe("4. Tabs Navigation", () => {
    it("should render tabs and trigger onChange on tab click", () => {
      const handleTabChange = vi.fn();
      const mockTabs = [
        { id: "ALL", label: "All Harvests" },
        { id: "AGRI", label: "Agriculture" },
        { id: "AQUA", label: "Aquaculture" },
      ];

      render(<Tabs tabs={mockTabs} activeTab="ALL" onChange={handleTabChange} />);

      expect(screen.getByText(/All Harvests/i)).toBeInTheDocument();
      const agriTab = screen.getByText(/Agriculture/i);
      fireEvent.click(agriTab);
      expect(handleTabChange).toHaveBeenCalledWith("AGRI");
    });
  });

  describe("5. Dialog Modal", () => {
    it("should render modal content when isOpen is true", () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen onClose={handleClose} title="Confirm Purchase" description="Are you sure?">
          <div>Order summary details</div>
        </Dialog>
      );

      expect(screen.getByText(/Confirm Purchase/i)).toBeInTheDocument();
      expect(screen.getByText(/Order summary details/i)).toBeInTheDocument();

      const closeButton = screen.getByLabelText(/Close dialog/i);
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should not render modal content when isOpen is false", () => {
      render(
        <Dialog isOpen={false} onClose={() => {}} title="Hidden Dialog">
          <div>Hidden content</div>
        </Dialog>
      );

      expect(screen.queryByText(/Hidden Dialog/i)).not.toBeInTheDocument();
    });
  });

  describe("6. EmptyState Component", () => {
    it("should render empty state message and action button", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No Products Found"
          description="Try broadening your commodity filters"
          actionLabel="Reset Filters"
          onAction={handleAction}
        />
      );

      expect(screen.getByText(/No Products Found/i)).toBeInTheDocument();
      expect(screen.getByText(/Try broadening your commodity filters/i)).toBeInTheDocument();
      const actionButton = screen.getByRole("button", { name: /Reset Filters/i });
      fireEvent.click(actionButton);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("7. ProductCard & StatCard Components", () => {
    it("should render ProductCard with title, price, and seller name", () => {
      render(
        <ProductCard
          id="p-1"
          slug="swarna-paddy"
          title="Swarna Paddy Grain"
          sector="AGRICULTURE"
          category="Cereals"
          pricePerUnit={2180}
          unit="QUINTAL"
          availableStock={500}
          sellerName="Ramesh Farmer"
          locationDistrict="Purba Bardhaman"
          locationState="West Bengal"
        />
      );

      expect(screen.getByText(/Swarna Paddy Grain/i)).toBeInTheDocument();
      expect(screen.getByText(/Ramesh Farmer/i)).toBeInTheDocument();
      expect(screen.getByText(/Purba Bardhaman, West Bengal/i)).toBeInTheDocument();
    });

    it("should render StatCard with title, metric, and percentage trend", () => {
      render(
        <StatCard
          title="Total Trade Volume"
          value="?1,24,500"
          change={{ value: "+18.4%", trend: "up" }}
          icon={Sprout}
        />
      );

      expect(screen.getByText(/Total Trade Volume/i)).toBeInTheDocument();
      expect(screen.getByText("?1,24,500")).toBeInTheDocument();
      expect(screen.getByText(/\+18\.4%/i)).toBeInTheDocument();
    });
  });
});
