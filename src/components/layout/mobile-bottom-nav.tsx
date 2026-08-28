import React from "react";
import Link from "next/link";
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
  const normalizedRole = userRole.toUpperCase();

  switch (normalizedRole) {
    case "FARMER":
      return [
        { label: "Portal", href: "/farmer", icon: LayoutDashboard },
        { label: "Products", href: "/farmer/products", icon: Package },
        { label: "Farms", href: "/farmer/farms", icon: Sprout },
        { label: "Orders", href: "/farmer/orders", icon: ShoppingCart },
        { label: "Messages", href: "/messages", icon: MessageSquare },
      ];

    case "BUYER":
      return [
        { label: "Market", href: "/marketplace", icon: Store },
        { label: "Saved", href: "/buyer/saved", icon: Bookmark },
        { label: "Cart", href: "/cart", icon: ShoppingBag },
        { label: "Orders", href: "/buyer/orders", icon: Package },
        { label: "Messages", href: "/messages", icon: MessageSquare },
      ];

    case "AGENT":
      return [
        { label: "Dashboard", href: "/agent", icon: LayoutDashboard },
        { label: "Leads", href: "/agent/leads", icon: UserPlus },
        { label: "Tasks", href: "/agent/tasks", icon: CheckSquare },
        { label: "Verify", href: "/agent/verification", icon: ShieldCheck },
        { label: "Messages", href: "/messages", icon: MessageSquare },
      ];

    case "SERVICE_PROVIDER":
      return [
        { label: "Portal", href: "/provider", icon: LayoutDashboard },
        { label: "Services", href: "/provider/services", icon: Wrench },
        { label: "Requests", href: "/provider/requests", icon: FileText },
        { label: "Network", href: "/network", icon: Users },
        { label: "Messages", href: "/messages", icon: MessageSquare },
      ];

    case "ADMIN":
      return [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Catalog", href: "/admin/products", icon: Package },
        { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
        { label: "Audit", href: "/admin/audit", icon: FileText },
      ];

    default:
      return [
        { label: "Home", href: "/", icon: Home },
        { label: "Market", href: "/marketplace", icon: Store },
        { label: "Network", href: "/network", icon: Users },
        { label: "Services", href: "/services", icon: Wrench },
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
  currentPath = "/",
  userRole = "GUEST",
  unreadMessages = 0,
}: MobileBottomNavProps) {
  const tabs = getRoleNavTabs(userRole);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-surface-dim bg-white shadow-stitch-card pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid h-16 w-full grid-cols-5 font-body">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentPath === tab.href ||
            (tab.href !== "/" &&
              tab.href !== "/farmer" &&
              tab.href !== "/admin" &&
              tab.href !== "/agent" &&
              tab.href !== "/provider" &&
              currentPath.startsWith(tab.href));

          const showBadge = tab.href === "/messages" && unreadMessages > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative inline-flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-1 transition-colors ${
                isActive
                  ? "text-brand-primary font-semibold"
                  : "text-slate-neutral hover:text-brand-primary"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? "text-brand-primary stroke-[2.5]" : "text-slate-neutral"
                  }`}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-secondary text-[9px] font-bold text-white">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
