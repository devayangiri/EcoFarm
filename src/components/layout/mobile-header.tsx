import React from "react";
import Link from "next/link";
import { Sprout, Waves, Search, Bell } from "lucide-react";

export interface MobileHeaderProps {
  userRole?: string;
  unreadNotifications?: number;
}

export function MobileHeader({
  userRole,
  unreadNotifications = 0,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex md:hidden h-14 w-full items-center justify-between border-b border-surface-dim bg-white/95 backdrop-blur px-4 pt-[env(safe-area-inset-top)]">
      <Link
        href="/"
        className="flex items-center gap-2 min-h-[44px] py-1 transition-opacity hover:opacity-90"
        aria-label="Agri-Aqua Network Home"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-primary text-white shadow-sm">
          <Sprout className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-center gap-1 font-heading text-base font-bold text-brand-primary">
          <span>Agri-Aqua</span>
          <Waves className="h-3.5 w-3.5 text-brand-secondary" />
        </div>
        {userRole && userRole !== "GUEST" && (
          <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-container text-brand-primary border border-surface-dim">
            {userRole.toLowerCase()}
          </span>
        )}
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/marketplace"
          className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-slate-neutral hover:text-brand-primary hover:bg-surface-low transition-colors"
          aria-label="Search Marketplace"
        >
          <Search className="h-5 w-5" />
        </Link>
        <Link
          href="/notifications"
          className="relative flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-slate-neutral hover:text-brand-primary hover:bg-surface-low transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-error"></span>
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
