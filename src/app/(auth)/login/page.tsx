import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In | EcoFarm",
  description: "Sign in to access your agricultural or aquacultural business portal on EcoFarm.",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to your EcoFarm account"
      footerContent={
        <p className="text-[11px] text-slate-neutral/80">
          By signing in, you agree to our Terms of Service & Privacy Policy.
        </p>
      }
    >
      <Suspense
        fallback={
          <div className="h-48 flex items-center justify-center text-xs text-slate-neutral font-body">
            Loading sign in...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
