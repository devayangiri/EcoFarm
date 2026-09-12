import React from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Password Recovery | EcoFarm",
  description: "Securely recover your EcoFarm account password using OTP verification.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Password Recovery"
      subtitle="Enter your registered contact to recover your account"
      footerContent={
        <p className="text-[11px] text-slate-neutral/80">
          Need immediate enterprise support? Contact support@ayangiri.com
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
