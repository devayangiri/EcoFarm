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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SidebarProps {
  currentPath?: string;
  userRole?: string;
}

export function Sidebar({ currentPath = "/", userRole = "FARMER" }: SidebarProps) {
  const navItems = [
    { label: "Dashboard", href: `/${userRole.toLowerCase()}`, icon: LayoutDashboard },
    { label: "Products / Listings", href: "/marketplace", icon: Package },
    { label: "Orders & Cart", href: "/orders", icon: ShoppingCart },
    { label: "Business Network", href: "/network", icon: Users },
    { label: "Services & Quotes", href: "/services", icon: Wrench },
    { label: "Verifications", href: "/verification", icon: FileCheck },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

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
