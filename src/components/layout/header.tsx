import React from "react";
import Link from "next/link";
import { Sprout, Waves, Search, Bell, MessageSquare, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface HeaderProps {
  userRole?: string;
  userName?: string;
  unreadNotifications?: number;
  unreadMessages?: number;
}

export function Header({
  userRole = "Guest",
  userName = "Welcome",
  unreadNotifications = 0,
  unreadMessages = 0,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-dim bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-stitch-container items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary text-white shadow-sm">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-heading text-lg font-bold tracking-tight text-brand-primary">
                <span>Agri-Aqua</span>
                <span className="flex items-center text-brand-secondary">
                  <Waves className="h-4 w-4" />
                </span>
                <span className="text-on-surface">Network</span>
              </div>
            </div>
          </Link>

          {/* Primary Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium font-body text-slate-neutral">
            <Link
              href="/marketplace"
              className="transition-colors hover:text-brand-primary"
            >
              Marketplace
            </Link>
            <Link
              href="/network"
              className="transition-colors hover:text-brand-primary"
            >
              Business Network
            </Link>
            <Link
              href="/services"
              className="transition-colors hover:text-brand-primary"
            >
              Services
            </Link>
          </nav>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <form action="/marketplace" method="GET" className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-neutral pointer-events-none" />
            <input
              name="search"
              type="text"
              placeholder="Search crops, seafood, equipment, services..."
              className="w-full h-9 pl-9 pr-4 rounded border border-surface-dim bg-surface-low text-sm font-body text-on-surface placeholder:text-slate-neutral/70 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:bg-white transition-all"
            />
          </form>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {userRole && userRole !== "Guest" && userRole !== "GUEST" ? (
            <>
              {/* Notification Icon */}
              <Link
                href="/notifications"
                className="relative p-2 rounded text-slate-neutral hover:text-brand-primary hover:bg-surface-low transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-status-error"></span>
                  </span>
                )}
              </Link>

              {/* Message Icon */}
              <Link
                href="/messages"
                className="relative p-2 rounded text-slate-neutral hover:text-brand-primary hover:bg-surface-low transition-colors"
                aria-label="Messages"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-secondary text-[10px] font-bold text-white">
                    {unreadMessages}
                  </span>
                )}
              </Link>

              {/* User Profile / Status */}
              <Link
                href={
                  userRole === "FARMER"
                    ? "/farmer/profile"
                    : userRole === "BUYER"
                    ? "/buyer/profile"
                    : userRole === "AGENT"
                    ? "/agent/profile"
                    : userRole === "SERVICE_PROVIDER"
                    ? "/provider"
                    : userRole === "ADMIN"
                    ? "/admin/settings"
                    : "/"
                }
                className="hidden sm:flex items-center gap-2 pl-2 border-l border-surface-dim hover:opacity-80 transition-opacity"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-brand-primary font-heading font-semibold text-xs border border-surface-dim">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold font-body text-on-surface leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] font-medium text-slate-neutral capitalize">
                    {userRole.toLowerCase()}
                  </span>
                </div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="ghost" className="text-slate-neutral hover:text-brand-primary">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" variant="primary">
                  Join Network
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
