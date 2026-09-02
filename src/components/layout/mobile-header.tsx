"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sprout,
  Waves,
  Search,
  Bell,
  Menu,
  X,
  ArrowRight,
  Store,
  Users,
  Wrench,
  HelpCircle,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MobileHeaderProps {
  userRole?: string;
  userName?: string;
  unreadNotifications?: number;
}

export function MobileHeader({
  userRole = "Guest",
  userName = "Welcome",
  unreadNotifications = 0,
}: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated =
    Boolean(userRole) &&
    userRole.toUpperCase() !== "GUEST" &&
    userRole.toLowerCase() !== "welcome";

  const getDashboardHref = (role: string) => {
    switch (role.toUpperCase()) {
      case "FARMER":
        return "/farmer";
      case "BUYER":
        return "/buyer";
      case "SERVICE_PROVIDER":
      case "PROVIDER":
        return "/provider";
      case "AGENT":
        return "/agent";
      case "ADMIN":
        return "/admin";
      default:
        return "/";
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network error
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex md:hidden h-14 w-full items-center justify-between border-b border-surface-dim/80 bg-white/95 backdrop-blur-md px-3 pt-[env(safe-area-inset-top)] shadow-sm">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 min-h-[44px] py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
          aria-label="Agri-Aqua Network Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white shadow-sm ring-1 ring-brand-primary/20">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 font-heading text-base font-bold text-brand-primary leading-none">
              <span>Agri-Aqua</span>
              <Waves className="h-3.5 w-3.5 text-brand-secondary" />
              <span className="text-on-surface">Network</span>
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-neutral/70 mt-0.5 leading-none">
              B2B Platform
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Search Trigger */}
          <Link
            href="/marketplace"
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-neutral hover:text-brand-primary hover:bg-surface-low transition-colors"
            aria-label="Search Marketplace"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Notifications (Authenticated) */}
          {isAuthenticated && (
            <Link
              href="/notifications"
              className="relative flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-neutral hover:text-brand-primary hover:bg-surface-low transition-colors"
              aria-label={`Notifications (${unreadNotifications} unread)`}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-status-error"></span>
                </span>
              )}
            </Link>
          )}

          {/* Mobile Menu Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-neutral hover:text-brand-primary hover:bg-surface-low transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Slide-down Drawer Panel for Mobile */}
      {isOpen && (
        <div className="fixed inset-x-0 top-14 z-40 md:hidden bg-white/98 backdrop-blur-lg border-b border-surface-dim shadow-stitch-modal p-4 space-y-4 animate-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          {isAuthenticated ? (
            <div className="p-3 rounded-lg bg-surface-low border border-surface-dim flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary text-white font-heading font-bold text-sm">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-on-surface">{userName}</p>
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                    {userRole} Account
                  </span>
                </div>
              </div>
              <Link
                href={getDashboardHref(userRole)}
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-brand-primary text-white text-xs font-semibold shadow-sm"
              >
                <span>Portal</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                <Button variant="outline" size="sm" className="w-full min-h-[44px] font-semibold text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsOpen(false)} className="w-full">
                <Button variant="primary" size="sm" className="w-full min-h-[44px] font-semibold text-xs">
                  Join Network
                </Button>
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1 border-t border-surface-dim pt-3">
            <Link
              href="/marketplace"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-low hover:text-brand-primary transition-colors"
            >
              <Store className="h-4 w-4 text-brand-primary" />
              <span>Commodity Marketplace</span>
            </Link>

            <Link
              href="/network"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-low hover:text-brand-primary transition-colors"
            >
              <Users className="h-4 w-4 text-brand-secondary" />
              <span>Business Network Directory</span>
            </Link>

            <Link
              href="/services"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-low hover:text-brand-primary transition-colors"
            >
              <Wrench className="h-4 w-4 text-brand-primary" />
              <span>Services & Equipment</span>
            </Link>

            <Link
              href="/#how-it-works"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-low hover:text-brand-primary transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-slate-neutral" />
              <span>How It Works</span>
            </Link>
          </div>

          {/* Sign Out (Authenticated) */}
          {isAuthenticated && (
            <div className="border-t border-surface-dim pt-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-semibold text-status-error hover:bg-status-error/10 transition-colors"
              >
                <LogOut className="h-4 w-4 text-status-error" />
                <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
