import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  FileCheck,
  BarChart3,
  Settings,
  HelpCircle,
  ShieldAlert,
  Sprout,
  Store,
  Bookmark,
  FileText,
  UserPlus,
  CheckSquare,
  ShieldCheck,
  User,
  Bell,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SidebarProps {
  currentPath?: string;
  userRole?: string;
}

export function getSidebarNavItems(userRole: string = "FARMER") {
  const normalizedRole = userRole.toUpperCase();

  switch (normalizedRole) {
    case "FARMER":
      return [
        { label: "Dashboard", href: "/farmer", icon: LayoutDashboard },
        { label: "Products / Listings", href: "/farmer/products", icon: Package },
        { label: "Manage Farms", href: "/farmer/farms", icon: Sprout },
        { label: "Orders & Cart", href: "/farmer/orders", icon: ShoppingCart },
        { label: "Business Network", href: "/network", icon: Users },
        { label: "Services & Quotes", href: "/services", icon: Wrench },
        { label: "Verifications", href: "/farmer/profile", icon: FileCheck },
        { label: "Analytics", href: "/farmer/analytics", icon: BarChart3 },
        { label: "Settings", href: "/settings", icon: Settings },
      ];

    case "BUYER":
      return [
        { label: "Dashboard", href: "/buyer", icon: LayoutDashboard },
        { label: "Marketplace", href: "/buyer/marketplace", icon: Store },
        { label: "Saved Listings", href: "/buyer/saved", icon: Bookmark },
        { label: "My Orders", href: "/buyer/orders", icon: ShoppingCart },
        { label: "Requirements", href: "/buyer/requirements", icon: FileText },
        { label: "Services", href: "/buyer/services", icon: Wrench },
        { label: "Business Network", href: "/network", icon: Users },
        { label: "Settings", href: "/settings", icon: Settings },
      ];

    case "AGENT":
      return [
        { label: "Dashboard", href: "/agent", icon: LayoutDashboard },
        { label: "Producer Leads", href: "/agent/leads", icon: UserPlus },
        { label: "Field Tasks", href: "/agent/tasks", icon: CheckSquare },
        { label: "KYC Verification", href: "/agent/verification", icon: ShieldCheck },
        { label: "Farmers", href: "/agent/farmers", icon: Users },
        { label: "Performance", href: "/agent/performance", icon: BarChart3 },
        { label: "Settings", href: "/settings", icon: Settings },
      ];

    case "SERVICE_PROVIDER":
      return [
        { label: "Dashboard", href: "/provider", icon: LayoutDashboard },
        { label: "My Services", href: "/provider/services", icon: Wrench },
        { label: "Business Network", href: "/network", icon: Users },
        { label: "Settings", href: "/settings", icon: Settings },
      ];

    case "ADMIN":
      return [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "User Management", href: "/admin/users", icon: Users },
        { label: "Product Catalog", href: "/admin/products", icon: Package },
        { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
        { label: "Verifications", href: "/admin/verification", icon: ShieldCheck },
        { label: "Disputes", href: "/admin/disputes", icon: ShieldAlert },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Audit Logs", href: "/admin/audit", icon: FileText },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ];

    default:
      return [
        { label: "Home", href: "/", icon: LayoutDashboard },
        { label: "Marketplace", href: "/marketplace", icon: Store },
        { label: "Business Network", href: "/network", icon: Users },
        { label: "Services", href: "/services", icon: Wrench },
        { label: "Settings", href: "/settings", icon: Settings },
      ];
  }
}

export function Sidebar({ currentPath = "/", userRole = "FARMER" }: SidebarProps) {
  const navItems = getSidebarNavItems(userRole);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-surface-dim bg-white p-4 justify-between h-[calc(100vh-4rem)] sticky top-16">
      <div className="space-y-6">
        {/* Role Badge Section */}
        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-low border border-surface-dim">
          <span className="text-xs font-semibold text-slate-neutral">Portal</span>
          <Badge variant="primary">{userRole}</Badge>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium font-body transition-colors ${
                  isActive
                    ? "bg-brand-primary text-white font-semibold"
                    : "text-slate-neutral hover:bg-surface-low hover:text-brand-primary"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-neutral"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Card */}
      <div className="rounded-md border border-surface-dim bg-surface-bright p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-status-success"></span>
          <span className="text-xs font-semibold text-on-surface">Agri-Aqua v0.1.0</span>
        </div>
        <p className="text-[11px] text-slate-neutral">Phase 1 Foundation Active</p>
      </div>
    </aside>
  );
}
