"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  ShieldCheck,
  Package,
  AlertTriangle,
  Flag,
  Star,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Product Moderation", href: "/admin/products", icon: ShoppingBag },
  { label: "Verification Oversight", href: "/admin/verification", icon: ShieldCheck },
  { label: "Order Supervision", href: "/admin/orders", icon: Package },
  { label: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
  { label: "Reports", href: "/admin/reports", icon: Flag },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Platform Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Audit Log", href: "/admin/audit", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-surface-dim p-3 lg:p-4 flex flex-col gap-1 font-body text-left shrink-0">
      <div className="hidden lg:block pb-3 mb-2 border-b border-surface-dim">
        <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-neutral">
          Governance & Control
        </span>
      </div>

      <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 gap-1.5 lg:gap-1 scrollbar-none -mx-3 px-3 lg:mx-0 lg:px-0">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[40px] lg:min-h-[36px] transition-colors shrink-0 ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "text-slate-neutral bg-surface-low lg:bg-transparent hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
