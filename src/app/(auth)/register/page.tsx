import React from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account | EcoFarm",
  description: "Join EcoFarm - the digital platform for agriculture and aquaculture.",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Join EcoFarm"
      subtitle="Connect directly with verified farmers, buyers, and service providers"
      footerContent={
        <p className="text-[11px] text-slate-neutral/80">
          Protected by enterprise B2B verification. No spam, ever.
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
