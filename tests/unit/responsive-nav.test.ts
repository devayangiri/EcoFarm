import { describe, it, expect } from "vitest";
import { getRoleNavTabs } from "@/components/layout/mobile-bottom-nav";

describe("Role-Aware Mobile Bottom Navigation", () => {
  it("generates correct tabs for FARMER role without exposing unauthorized portals", () => {
    const tabs = getRoleNavTabs("FARMER");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Portal", "Products", "Farms", "Orders", "Messages"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/farmer",
      "/farmer/products",
      "/farmer/farms",
      "/farmer/orders",
      "/messages",
    ]);
    expect(tabs.some((t) => t.href.startsWith("/admin"))).toBe(false);
    expect(tabs.some((t) => t.href.startsWith("/agent"))).toBe(false);
  });

  it("generates correct tabs for BUYER role without exposing unauthorized portals", () => {
    const tabs = getRoleNavTabs("BUYER");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Market", "Saved", "Cart", "Orders", "Messages"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/marketplace",
      "/buyer/saved",
      "/cart",
      "/buyer/orders",
      "/messages",
    ]);
    expect(tabs.some((t) => t.href.startsWith("/admin"))).toBe(false);
    expect(tabs.some((t) => t.href.startsWith("/farmer"))).toBe(false);
  });

  it("generates correct tabs for AGENT role", () => {
    const tabs = getRoleNavTabs("AGENT");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Dashboard", "Leads", "Tasks", "Verify", "Messages"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/agent",
      "/agent/leads",
      "/agent/tasks",
      "/agent/verification",
      "/messages",
    ]);
  });

  it("generates correct tabs for SERVICE_PROVIDER role", () => {
    const tabs = getRoleNavTabs("SERVICE_PROVIDER");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Portal", "Services", "Requests", "Network", "Messages"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/provider",
      "/provider/services",
      "/provider/requests",
      "/network",
      "/messages",
    ]);
  });

  it("generates correct tabs for ADMIN role", () => {
    const tabs = getRoleNavTabs("ADMIN");
    expect(tabs.length).toBe(5);
    expect(tabs.map((t) => t.label)).toEqual(["Dashboard", "Users", "Catalog", "Orders", "Audit"]);
    expect(tabs.map((t) => t.href)).toEqual([
      "/admin",
      "/admin/users",
      "/admin/products",
      "/admin/orders",
      "/admin/audit",
    ]);
  });

  it("defaults to public/GUEST tabs when unauthenticated or unknown role provided", () => {
    const guestTabs = getRoleNavTabs("GUEST");
    expect(guestTabs.map((t) => t.label)).toEqual(["Home", "Market", "Network", "Services", "Sign In"]);
    expect(guestTabs.map((t) => t.href)).toEqual(["/", "/marketplace", "/network", "/services", "/login"]);

    const undefinedTabs = getRoleNavTabs(undefined);
    expect(undefinedTabs.map((t) => t.label)).toEqual(["Home", "Market", "Network", "Services", "Sign In"]);
  });
});
