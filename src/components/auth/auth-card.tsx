"use client";

import React from "react";
import Link from "next/link";
import { Sprout, Waves } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footerContent,
}: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary text-white shadow-sm">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-1 font-heading text-xl font-bold tracking-tight text-brand-primary">
              <span>Eco</span>
              <Waves className="h-4 w-4 text-brand-secondary" />
              <span className="text-on-surface">Farm</span>
            </div>
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface pt-1">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-neutral font-body">
            {subtitle}
          </p>
        </div>

        {/* Card Body */}
        <Card className="border border-surface-dim bg-white shadow-stitch-card">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {children}
          </CardContent>
        </Card>

        {/* Footer */}
        {footerContent && (
          <div className="text-center text-xs text-slate-neutral font-body">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}
