"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Store,
  Users,
  Wrench,
  User,
  LayoutDashboard,
  Package,
  Sprout,
  ShoppingCart,
  ShoppingBag,
  MessageSquare,
  Bookmark,
  UserPlus,
  CheckSquare,
  ShieldCheck,
  FileText,
} from "lucide-react";

export interface MobileNavTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export function getRoleNavTabs(userRole: string = "GUEST"): MobileNavTab[] {
  const normalizedRole = userRole ? userRole.toUpperCase() : "GUEST";

  switch (normalizedRole) {
    case "FARMER":
      return [
        { label: "Home", href: "/farmer", icon: Home },
        { label: "Products", href: "/farmer/products", icon: Package },
        { label: "Orders", href: "/farmer/orders", icon: ShoppingCart },
        { label: "Messages", href: "/messages", icon: MessageSquare },
        { label: "Account", href: "/farmer/profile", icon: User },
      ];

    case "BUYER":
      return [
        { label: "Home", href: "/buyer", icon: Home },
        { label: "Shop", href: "/marketplace", icon: Store },
        { label: "Orders", href: "/buyer/orders", icon: Package },
        { label: "Messages", href: "/messages", icon: MessageSquare },
        { label: "Account", href: "/buyer/profile", icon: User },
      ];

    case "AGENT":
      return [
        { label: "Home", href: "/agent", icon: Home },
        { label: "Leads", href: "/agent/leads", icon: UserPlus },
        { label: "Tasks", href: "/agent/tasks", icon: CheckSquare },
        { label: "Messages", href: "/messages", icon: MessageSquare },
        { label: "Account", href: "/settings", icon: User },
      ];

    case "SERVICE_PROVIDER":
    case "PROVIDER":
      return [
        { label: "Home", href: "/provider", icon: Home },
        { label: "Services", href: "/provider/services", icon: Wrench },
        { label: "Orders", href: "/provider/requests", icon: FileText },
        { label: "Messages", href: "/messages", icon: MessageSquare },
        { label: "Account", href: "/settings", icon: User },
      ];

    case "ADMIN":
      return [
        { label: "Home", href: "/admin", icon: Home },
        { label: "Products", href: "/admin/products", icon: Package },
        { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Account", href: "/settings", icon: User },
      ];

    default:
      return [
        { label: "Home", href: "/", icon: Home },
        { label: "Shop", href: "/marketplace", icon: Store },
        { label: "Services", href: "/services", icon: Wrench },
        { label: "Network", href: "/network", icon: Users },
        { label: "Sign In", href: "/login", icon: User },
      ];
  }
}


export interface MobileBottomNavProps {
  currentPath?: string;
  userRole?: string;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export function MobileBottomNav({
  currentPath,
  userRole = "GUEST",
  unreadMessages = 0,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const activePath = currentPath || pathname || "/";
  const tabs = getRoleNavTabs(userRole);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-surface-dim/90 bg-white/98 backdrop-blur-lg shadow-[0_-2px_8px_rgba(13,28,47,0.06)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid h-16 w-full grid-cols-5 font-body">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activePath === tab.href ||
            (tab.href !== "/" &&
              tab.href !== "/farmer" &&
              tab.href !== "/admin" &&
              tab.href !== "/agent" &&
              tab.href !== "/provider" &&
              tab.href !== "/buyer" &&
              activePath.startsWith(`${tab.href}/`));

          const showBadge = tab.href === "/messages" && unreadMessages > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative inline-flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-1 py-1 transition-all ${
                isActive
                  ? "text-brand-primary font-bold"
                  : "text-slate-neutral/80 hover:text-brand-primary"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform duration-150 ${
                    isActive
                      ? "text-brand-primary scale-110 stroke-[2.5]"
                      : "text-slate-neutral/70"
                  }`}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-secondary text-[9px] font-bold text-white shadow-sm">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight truncate max-w-full leading-none ${
                  isActive ? "font-bold text-brand-primary" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-1 h-1 w-6 bg-brand-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
