"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sprout,
  Waves,
  Search,
  X,
  Bell,
  MessageSquare,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  User,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HeaderProps {
  userRole?: string;
  userName?: string;
  unreadNotifications?: number;
  unreadMessages?: number;
  currentPath?: string;
}

export function Header({
  userRole = "Guest",
  userName = "Welcome",
  unreadNotifications = 0,
  unreadMessages = 0,
  currentPath,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activePath = currentPath || pathname || "/";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync headerSearch with URL query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const search = params.get("search");
      if (search) {
        setHeaderSearch(search);
      } else if (!pathname?.startsWith("/marketplace")) {
        setHeaderSearch("");
      }
    }
  }, [pathname]);

  // Global shortcut (⌘K or Ctrl+K) to focus the header search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = headerSearch.trim();
    if (query) {
      router.push(`/marketplace?search=${encodeURIComponent(query)}`);
    } else {
      router.push("/marketplace");
    }
  };

  const handleClearSearch = () => {
    setHeaderSearch("");
    searchInputRef.current?.focus();
  };

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

  const getProfileHref = (role: string) => {
    switch (role.toUpperCase()) {
      case "FARMER":
        return "/farmer/profile";
      case "BUYER":
        return "/buyer/profile";
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

  const navLinks = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Business Network", href: "/network" },
    { label: "Services", href: "/services" },
    { label: "How It Works", href: "/#how-it-works" },
  ];

  return (
    <header className="hidden md:block sticky top-0 z-40 w-full border-b border-surface-dim/80 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(13,28,47,0.04)]">
      <div className="mx-auto flex h-18 sm:h-20 max-w-stitch-container items-center justify-between gap-3 lg:gap-4 xl:gap-6 px-4 sm:px-6 lg:px-8">
        {/* 1. Left: Brand Logo & Tagline */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md shrink-0"
          aria-label="EcoFarm Home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary text-white shadow-sm ring-1 ring-brand-primary/20 shrink-0">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 font-heading text-lg font-bold tracking-tight text-brand-primary leading-none">
              <span>Eco</span>
              <span className="flex items-center text-brand-secondary">
                <Waves className="h-4 w-4" />
              </span>
              <span className="text-on-surface">Farm</span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-neutral/70 mt-1 leading-none">
              Digital Agriculture Platform
            </span>
          </div>
        </Link>

        {/* 2. Center/Main: Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-1 lg:gap-1.5 shrink-0"
        >
          {navLinks.map((link) => {
            const isActive =
              link.href === "/#how-it-works"
                ? false
                : activePath === link.href || activePath.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative px-2.5 lg:px-3 py-1.5 text-xs lg:text-sm font-semibold transition-all rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary whitespace-nowrap ${
                  isActive
                    ? "text-brand-primary bg-surface-low font-bold"
                    : "text-slate-neutral hover:text-brand-primary hover:bg-surface-low/60"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-brand-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 3. Search: High-Visibility Real Functional Search Form (320-460px) */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="flex items-center relative h-10 w-full max-w-[260px] lg:max-w-[340px] xl:max-w-[420px] rounded-xl border border-slate-300/90 bg-white text-xs text-on-surface shadow-xs hover:border-brand-primary/50 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all shrink"
        >
          <button
            type="submit"
            className="flex items-center justify-center pl-3 pr-2 text-slate-neutral hover:text-brand-primary transition-colors focus:outline-none"
            aria-label="Submit search"
          >
            <Search className="h-4 w-4 text-brand-primary" />
          </button>
          <input
            ref={searchInputRef}
            type="text"
            name="search"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            placeholder="Search commodities..."
            aria-label="Search commodities"
            className="w-full bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-slate-neutral/80 focus:outline-none pr-1.5"
          />
          {headerSearch ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search text"
              className="pr-3 text-slate-neutral/60 hover:text-on-surface transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex h-5 mr-2.5 items-center rounded border border-surface-dim bg-surface-low px-1.5 text-[10px] font-mono font-medium text-slate-neutral/70 pointer-events-none select-none">
              ⌘K
            </kbd>
          )}
        </form>

        {/* 4. Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">

          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notification Icon */}
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-surface-dim bg-white text-slate-neutral hover:text-brand-primary hover:bg-surface-low hover:border-brand-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label={`Notifications (${unreadNotifications} unread)`}
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-error px-1 text-[9px] font-bold text-white shadow-sm">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* Message Icon */}
              <Link
                href="/messages"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-surface-dim bg-white text-slate-neutral hover:text-brand-primary hover:bg-surface-low hover:border-brand-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label={`Messages (${unreadMessages} unread)`}
              >
                <MessageSquare className="h-4 w-4" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-secondary px-1 text-[9px] font-bold text-white shadow-sm">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>

              {/* User Dropdown / Portal Launcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  onBlur={() => setTimeout(() => setShowProfileMenu(false), 200)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg border border-surface-dim bg-white hover:bg-surface-low transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                  aria-label="User Account Menu"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-primary text-white font-heading font-bold text-xs shadow-sm">
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-on-surface leading-tight max-w-[120px] truncate">
                      {userName}
                    </span>
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                      {userRole}
                    </span>
                  </div>
                  <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-neutral/60" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-surface-dim bg-white p-1.5 shadow-stitch-modal text-xs font-body z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-2 border-b border-surface-dim mb-1">
                      <p className="font-semibold text-on-surface truncate">{userName}</p>
                      <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                        {userRole} Account
                      </p>
                    </div>

                    <Link
                      href={getDashboardHref(userRole)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-on-surface hover:bg-surface-low hover:text-brand-primary font-medium transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-brand-primary" />
                      <span>Role Portal</span>
                    </Link>

                    <Link
                      href={getProfileHref(userRole)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-on-surface hover:bg-surface-low hover:text-brand-primary font-medium transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-neutral" />
                      <span>Profile & Settings</span>
                    </Link>

                    <div className="border-t border-surface-dim my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-status-error hover:bg-status-error/10 font-medium transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4 text-status-error" />
                      <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold text-xs text-on-surface hover:text-brand-primary hover:bg-surface-low px-3 h-9"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="primary"
                  size="sm"
                  className="font-semibold text-xs shadow-sm px-4 h-9 gap-1.5"
                >
                  <span>Join EcoFarm</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
