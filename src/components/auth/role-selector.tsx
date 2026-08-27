"use client";

import React from "react";
import { Sprout, ShoppingCart, UserCheck, Wrench, CheckCircle2 } from "lucide-react";
import type { UserRole } from "@/types/role.types";
import { cn } from "@/lib/utils";

export interface RoleOption {
  role: UserRole;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "FARMER",
    title: "Farmer / Producer",
    subtitle: "Grow & Sell Crops / Aquaculture",
    description: "Publish harvests, receive direct bulk inquiries, and manage farm sales.",
    icon: Sprout,
  },
  {
    role: "BUYER",
    title: "Commercial Buyer",
    subtitle: "Procure Produce & Inputs",
    description: "Source verified agricultural & aquaculture goods, place orders, and track deliveries.",
    icon: ShoppingCart,
  },
  {
    role: "AGENT",
    title: "Field Agent",
    subtitle: "Facilitate Trade & Support",
    description: "Support farmer onboarding, manage leads, and assist with document verification.",
    icon: UserCheck,
  },
  {
    role: "SERVICE_PROVIDER",
    title: "Service Provider",
    subtitle: "Machinery, Storage & Testing",
    description: "List machinery rentals, cold storage, logistics, and issue commercial quotations.",
    icon: Wrench,
  },
];

export interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelector({ selectedRole, onSelectRole }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
      {ROLE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedRole === option.role;

        return (
          <button
            key={option.role}
            type="button"
            onClick={() => onSelectRole(option.role)}
            className={cn(
              "relative flex flex-col p-4 rounded-md border text-left transition-all",
              isSelected
                ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary shadow-sm"
                : "border-surface-dim bg-white hover:border-brand-secondary/50 hover:bg-surface-low"
            )}
          >
            {isSelected && (
              <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-brand-primary" />
            )}

            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md mb-2.5",
                isSelected
                  ? "bg-brand-primary text-white"
                  : "bg-surface-container text-brand-secondary"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <span className="font-heading text-sm font-bold text-on-surface">
              {option.title}
            </span>
            <span className="text-[11px] font-semibold text-brand-secondary mt-0.5">
              {option.subtitle}
            </span>
            <p className="text-[11px] text-slate-neutral font-body mt-1.5 leading-relaxed">
              {option.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
