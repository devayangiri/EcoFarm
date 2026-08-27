"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordField } from "./password-field";
import { RoleSelector } from "./role-selector";
import { AuthError } from "./auth-error";
import type { UserRole } from "@/types/role.types";

export function RegisterForm() {
  const router = useRouter();

  // Multi-step state: 1 = Details, 2 = Role Selection
  const [step, setStep] = useState<1 | 2>(1);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("FARMER");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validate Step 1 before moving to Step 2
  const handleProceedToRole = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Please enter your full name (minimum 2 characters)");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must include at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setStep(2);
  };

  // Submit complete registration
  const handleFinalSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          password,
          confirmPassword,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || "Registration failed. Please check your information.");
        setIsLoading(false);
        return;
      }

      // Registration successful -> Navigate to user dashboard
      const targetUrl = result.data.redirectUrl || "/";
      router.push(targetUrl);
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please check your network and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-left font-body">
      <AuthError message={error} onDismiss={() => setError(null)} />

      {/* Progress Step Indicator */}
      <div className="flex items-center justify-between border-b border-surface-dim pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === 1
                ? "bg-brand-primary text-white"
                : "bg-status-success text-white"
            }`}
          >
            {step === 2 ? <Check className="h-3.5 w-3.5" /> : "1"}
          </div>
          <span className="text-xs font-semibold text-on-surface">Account Info</span>
        </div>

        <div className="h-0.5 w-12 bg-surface-dim" />

        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === 2
                ? "bg-brand-primary text-white"
                : "bg-surface-dim text-slate-neutral"
            }`}
          >
            2
          </div>
          <span className="text-xs font-semibold text-slate-neutral">Role Selection</span>
        </div>
      </div>

      {/* Step 1: Account Information */}
      {step === 1 && (
        <form onSubmit={handleProceedToRole} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface">
              Full Name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-neutral/70">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full h-10 pl-9 pr-3 rounded border border-surface-dim bg-white text-sm text-on-surface placeholder:text-slate-neutral/50 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-all"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-neutral/70">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-10 pl-9 pr-3 rounded border border-surface-dim bg-white text-sm text-on-surface placeholder:text-slate-neutral/50 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-all"
                required
              />
            </div>
          </div>

          {/* Phone Number (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface">
              Phone Number <span className="text-slate-neutral font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-neutral/70">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-10 pl-9 pr-3 rounded border border-surface-dim bg-white text-sm text-on-surface placeholder:text-slate-neutral/50 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <PasswordField
            label="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters with numbers & letters"
            required
          />

          {/* Confirm Password */}
          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
          />

          <Button type="submit" variant="primary" size="lg" className="w-full gap-2 mt-2">
            <span>Continue to Role Selection</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Step 2: Role Selection */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-heading text-sm font-bold text-on-surface">
              How will you participate in the Network?
            </h3>
            <p className="text-xs text-slate-neutral mt-0.5 font-body">
              Select your primary ecosystem function. You can expand services later.
            </p>
          </div>

          <RoleSelector selectedRole={role} onSelectRole={(r) => setRole(r)} />

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setStep(1)}
              className="gap-2"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleFinalSubmit}
              className="flex-1 gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Switch to Sign In */}
      <div className="text-center pt-3 border-t border-surface-dim text-xs text-slate-neutral">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
