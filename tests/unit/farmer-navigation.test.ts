import { describe, it, expect } from "vitest";
import { getSidebarNavItems, isNavItemActive } from "@/components/layout/sidebar";

describe("Farmer Workspace Navigation & Sidebar Architecture", () => {
  describe("1. Farmer Sidebar Item Audit & Cleanup", () => {
    const farmerItems = getSidebarNavItems("FARMER");

    it("returns exactly 7 workspace-specific navigation items", () => {
      expect(farmerItems.length).toBe(7);
      expect(farmerItems.map((i) => i.label)).toEqual([
        "Dashboard",
        "Products / Listings",
        "Manage Farms",
        "Orders",
        "Profile",
        "Analytics",
        "Settings",
      ]);
      expect(farmerItems.map((i) => i.href)).toEqual([
        "/farmer",
        "/farmer/products",
        "/farmer/farms",
        "/farmer/orders",
        "/farmer/profile",
        "/farmer/analytics",
        "/settings",
      ]);
    });

    it("does NOT contain duplicate global cross-platform navigation destinations", () => {
      const hrefs = farmerItems.map((i) => i.href);
      const labels = farmerItems.map((i) => i.label);

      // Business Network should only be in global header
      expect(hrefs).not.toContain("/network");
      expect(labels).not.toContain("Business Network");

      // Services should only be in global header
      expect(hrefs).not.toContain("/services");
      expect(labels).not.toContain("Services & Quotes");
    });

    it("does NOT expose future-phase cart functionality", () => {
      const labels = farmerItems.map((i) => i.label);
      expect(labels).not.toContain("Orders & Cart");
      expect(labels).toContain("Orders");
    });

    it("uses Profile label for /farmer/profile accurately reflecting current page capabilities", () => {
      const profileItem = farmerItems.find((i) => i.href === "/farmer/profile");
      expect(profileItem).toBeDefined();
      expect(profileItem?.label).toBe("Profile");
    });
  });

  describe("2. Active Link Matching Logic (Root-Aware & Nested Subroutes)", () => {
    it("exact matches root /farmer without false positives on nested farmer sections", () => {
      expect(isNavItemActive("/farmer", "/farmer")).toBe(true);
      expect(isNavItemActive("/farmer?page=1", "/farmer")).toBe(true);
      expect(isNavItemActive("/farmer/", "/farmer")).toBe(true);

      // Must NOT match child routes
      expect(isNavItemActive("/farmer/products", "/farmer")).toBe(false);
      expect(isNavItemActive("/farmer/products/new", "/farmer")).toBe(false);
      expect(isNavItemActive("/farmer/farms", "/farmer")).toBe(false);
      expect(isNavItemActive("/farmer/orders", "/farmer")).toBe(false);
      expect(isNavItemActive("/farmer/profile", "/farmer")).toBe(false);
      expect(isNavItemActive("/farmer/analytics", "/farmer")).toBe(false);
      expect(isNavItemActive("/settings", "/farmer")).toBe(false);
    });

    it("correctly highlights parent Products link when on child/nested routes", () => {
      expect(isNavItemActive("/farmer/products", "/farmer/products")).toBe(true);
      expect(isNavItemActive("/farmer/products/new", "/farmer/products")).toBe(true);
      expect(isNavItemActive("/farmer/products/prod-uuid-123", "/farmer/products")).toBe(true);
      expect(isNavItemActive("/farmer/products/prod-uuid-123/edit", "/farmer/products")).toBe(true);
      expect(isNavItemActive("/farmer/products?category=Grains", "/farmer/products")).toBe(true);

      // Must NOT match sibling routes
      expect(isNavItemActive("/farmer/farms", "/farmer/products")).toBe(false);
      expect(isNavItemActive("/farmer/orders", "/farmer/products")).toBe(false);
    });

    it("correctly highlights parent Farms link on subroutes", () => {
      expect(isNavItemActive("/farmer/farms", "/farmer/farms")).toBe(true);
      expect(isNavItemActive("/farmer/farms/new", "/farmer/farms")).toBe(true);
      expect(isNavItemActive("/farmer/farms?sector=AGRICULTURE", "/farmer/farms")).toBe(true);
      expect(isNavItemActive("/farmer/orders", "/farmer/farms")).toBe(false);
    });

    it("correctly highlights parent Orders link on subroutes", () => {
      expect(isNavItemActive("/farmer/orders", "/farmer/orders")).toBe(true);
      expect(isNavItemActive("/farmer/orders/sub-ord-456", "/farmer/orders")).toBe(true);
      expect(isNavItemActive("/farmer/orders?status=PENDING", "/farmer/orders")).toBe(true);
      expect(isNavItemActive("/farmer/products", "/farmer/orders")).toBe(false);
    });

    it("correctly highlights Settings and Profile", () => {
      expect(isNavItemActive("/settings", "/settings")).toBe(true);
      expect(isNavItemActive("/settings/security", "/settings")).toBe(true);
      expect(isNavItemActive("/farmer/profile", "/farmer/profile")).toBe(true);
      expect(isNavItemActive("/settings", "/farmer/profile")).toBe(false);
    });
  });

  describe("3. Non-Farmer Roles Isolation & Regression", () => {
    it("preserves BUYER sidebar configuration unchanged", () => {
      const buyerItems = getSidebarNavItems("BUYER");
      expect(buyerItems.map((i) => i.label)).toEqual([
        "Dashboard",
        "Marketplace",
        "Saved Listings",
        "My Orders",
        "Requirements",
        "Services",
        "Business Network",
        "Settings",
      ]);
    });

    it("preserves AGENT sidebar configuration unchanged", () => {
      const agentItems = getSidebarNavItems("AGENT");
      expect(agentItems.map((i) => i.label)).toEqual([
        "Dashboard",
        "Producer Leads",
        "Field Tasks",
        "KYC Verification",
        "Farmers",
        "Performance",
        "Settings",
      ]);
    });

    it("preserves SERVICE_PROVIDER sidebar configuration unchanged", () => {
      const providerItems = getSidebarNavItems("SERVICE_PROVIDER");
      expect(providerItems.map((i) => i.label)).toEqual([
        "Dashboard",
        "My Services",
        "Business Network",
        "Settings",
      ]);
    });

    it("preserves ADMIN sidebar configuration unchanged", () => {
      const adminItems = getSidebarNavItems("ADMIN");
      expect(adminItems.map((i) => i.label)).toEqual([
        "Dashboard",
        "User Management",
        "Product Catalog",
        "Orders",
        "Verifications",
        "Disputes",
        "Analytics",
        "Audit Logs",
        "Settings",
      ]);
    });

    it("preserves default/guest configuration unchanged", () => {
      const guestItems = getSidebarNavItems("GUEST");
      expect(guestItems.map((i) => i.label)).toEqual([
        "Home",
        "Marketplace",
        "Business Network",
        "Services",
        "Settings",
      ]);
    });
  });
});
