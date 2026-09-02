import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Password Recovery | Agri-Aqua Network",
  description: "Account recovery instructions for Agri-Aqua Network members.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Password Recovery"
      subtitle="Reset instructions for verified business accounts"
      footerContent={
        <p className="text-[11px] text-slate-neutral/80">
          Need immediate enterprise support? Contact support@ayangiri.com
        </p>
      }
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-slate-neutral leading-relaxed">
            To protect trade and order integrity, password resets for producer and buyer accounts are verified through our platform support team or your assigned regional field agent.
          </p>
          <div className="p-3 rounded-lg bg-surface-low border border-surface-dim text-xs text-on-surface">
            <span className="font-semibold">Direct Support Email:</span>{" "}
            <a href="mailto:support@ayangiri.com" className="text-brand-primary font-bold hover:underline">
              support@ayangiri.com
            </a>
          </div>
        </div>
        <Link href="/login" className="block pt-2">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Sign In</span>
          </Button>
        </Link>
      </div>
    </AuthCard>
  );
}
