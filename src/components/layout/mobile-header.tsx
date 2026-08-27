import React from "react";
import Link from "next/link";
import { Sprout, Waves, Search, Bell } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex md:hidden h-14 w-full items-center justify-between border-b border-surface-dim bg-white px-4">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-primary text-white">
          <Sprout className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-center gap-1 font-heading text-base font-bold text-brand-primary">
          <span>Agri-Aqua</span>
          <Waves className="h-3.5 w-3.5 text-brand-secondary" />
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href="/marketplace"
          className="p-1.5 rounded text-slate-neutral hover:bg-surface-low"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Link>
        <Link
          href="/notifications"
          className="p-1.5 rounded text-slate-neutral hover:bg-surface-low"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
