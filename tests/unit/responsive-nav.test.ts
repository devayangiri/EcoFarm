import { describe, it, expect } from "vitest";
import { getRoleNavTabs } from "@/components/layout/mobile-bottom-nav";

describe("Role-Aware Mobile Bottom Navigation", () => {
  it("generates correct tabs for FARMER role without exposing unauthorized portals", () => {
    const tabs = getRoleNavTabs("FARMER");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Home", "Products", "Orders", "Messages", "Account"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/farmer",
      "/farmer/products",
      "/farmer/orders",
      "/messages",
      "/farmer/profile",
    ]);
    expect(tabs.some((t) => t.href.startsWith("/admin"))).toBe(false);
    expect(tabs.some((t) => t.href.startsWith("/agent"))).toBe(false);
  });

  it("generates correct tabs for BUYER role without exposing unauthorized portals", () => {
    const tabs = getRoleNavTabs("BUYER");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Home", "Shop", "Orders", "Messages", "Account"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/buyer",
      "/marketplace",
      "/buyer/orders",
      "/messages",
      "/buyer/profile",
    ]);
    expect(tabs.some((t) => t.href.startsWith("/admin"))).toBe(false);
    expect(tabs.some((t) => t.href.startsWith("/farmer"))).toBe(false);
  });

  it("generates correct tabs for AGENT role", () => {
    const tabs = getRoleNavTabs("AGENT");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Home", "Leads", "Tasks", "Messages", "Account"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/agent",
      "/agent/leads",
      "/agent/tasks",
      "/messages",
      "/settings",
    ]);
  });

  it("generates correct tabs for SERVICE_PROVIDER role", () => {
    const tabs = getRoleNavTabs("SERVICE_PROVIDER");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Home", "Services", "Orders", "Messages", "Account"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/provider",
      "/provider/services",
      "/provider/requests",
      "/messages",
      "/settings",
    ]);
  });

  it("generates correct tabs for ADMIN role", () => {
    const tabs = getRoleNavTabs("ADMIN");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Home", "Products", "Orders", "Users", "Account"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/admin",
      "/admin/products",
      "/admin/orders",
      "/admin/users",
      "/settings",
    ]);
  });

  it("defaults to public/GUEST tabs when unauthenticated or unknown role provided", () => {
    const guestTabs = getRoleNavTabs("GUEST");
    expect(guestTabs.map((t) => t.label)).toEqual(["Home", "Shop", "Services", "Network", "Sign In"]);
    expect(guestTabs.map((t) => t.href)).toEqual(["/", "/marketplace", "/services", "/network", "/login"]);

    const undefinedTabs = getRoleNavTabs(undefined);
    expect(undefinedTabs.map((t) => t.label)).toEqual(["Home", "Shop", "Services", "Network", "Sign In"]);
  });
});
