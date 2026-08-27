import React from "react";
import Link from "next/link";
import { Home, Store, Users, Wrench, User } from "lucide-react";

export interface MobileBottomNavProps {
  currentPath?: string;
}

export function MobileBottomNav({ currentPath = "/" }: MobileBottomNavProps) {
  const tabs = [
    { label: "Home", href: "/", icon: Home },
    { label: "Market", href: "/marketplace", icon: Store },
    { label: "Network", href: "/network", icon: Users },
    { label: "Services", href: "/services", icon: Wrench },
    { label: "Account", href: "/settings", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden h-16 border-t border-surface-dim bg-white shadow-stitch-card">
      <div className="grid h-full w-full grid-cols-5 font-body">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex flex-col items-center justify-center px-1 transition-colors ${
                isActive
                  ? "text-brand-primary font-semibold"
                  : "text-slate-neutral hover:text-brand-primary"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-brand-primary stroke-[2.5]" : "text-slate-neutral"}`} />
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
