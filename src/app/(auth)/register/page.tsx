import React from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account | Agri-Aqua Network",
  description: "Join the digital business network for agriculture and aquaculture.",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Join the Network"
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
