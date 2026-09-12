"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordField } from "./password-field";
import { RoleSelector } from "./role-selector";
import { AuthError } from "./auth-error";
import type { UserRole } from "@/types/role.types";

export function RegisterForm() {
  const router = useRouter();

  // Multi-step state: 1 = Details, 2 = Role Selection, 3 = OTP Verification
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("FARMER");

  // OTP Verification state
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [maskedDestination, setMaskedDestination] = useState<string>("");
  const [destinationType, setDestinationType] = useState<string>("EMAIL");
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [expiresIn, setExpiresIn] = useState<number>(600); // 10 minutes in seconds
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer effect for resend cooldown and OTP expiration
  useEffect(() => {
    if (step !== 3) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  // Submit registration to initiate challenge
  const handleFinalSubmit = async () => {
    setError(null);
    setInfoMessage(null);
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

      // If direct registration occurred (e.g. test environment autoActivate)
      if (result.data?.redirectUrl && !result.data?.verificationToken) {
        router.push(result.data.redirectUrl);
        router.refresh();
        return;
      }

      // Transition to OTP verification step
      setVerificationToken(result.data.verificationToken);
      setMaskedDestination(result.data.destination || email.trim().toLowerCase());
      setDestinationType(result.data.destinationType || "EMAIL");
      setResendCooldown(60);
      setExpiresIn(600);
      setOtp("");
      setIsLoading(false);
      setStep(3);
    } catch {
      setError("Unable to connect to the server. Please check your network and try again.");
      setIsLoading(false);
    }
  };

  // Verify OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    if (expiresIn <= 0) {
      setError("Verification code has expired. Please click 'Resend Code' to receive a new one.");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationToken,
          destination: email.trim().toLowerCase(),
          otp: cleanOtp,
          purpose: "REGISTRATION",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || "Invalid or expired verification code. Please try again.");
        setIsVerifying(false);
        return;
      }

      // Verification successful -> redirect to dashboard
      const targetUrl = result.data.redirectUrl || "/";
      router.push(targetUrl);
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please check your network and try again.");
      setIsVerifying(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setError(null);
    setInfoMessage(null);
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/register/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationToken,
          destination: email.trim().toLowerCase(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || "Failed to resend verification code. Please wait a moment.");
        setIsResending(false);
        return;
      }

      if (result.data?.verificationToken) {
        setVerificationToken(result.data.verificationToken);
      }
      setResendCooldown(60);
      setExpiresIn(600);
      setInfoMessage("A new verification code has been dispatched!");
      setIsResending(false);
    } catch {
      setError("Unable to reach the server. Please check your connection.");
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-5 text-left font-body">
      <AuthError message={error} onDismiss={() => setError(null)} />

      {infoMessage && (
        <div className="p-3 rounded border border-status-success/30 bg-status-success/10 text-status-success text-xs font-medium flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}

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
            {step > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
          </div>
          <span className="text-xs font-semibold text-on-surface">Account Info</span>
        </div>

        <div className="h-0.5 w-8 bg-surface-dim" />

        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === 2
                ? "bg-brand-primary text-white"
                : step > 2
                ? "bg-status-success text-white"
                : "bg-surface-dim text-slate-neutral"
            }`}
          >
            {step > 2 ? <Check className="h-3.5 w-3.5" /> : "2"}
          </div>
          <span
            className={`text-xs font-semibold ${
              step >= 2 ? "text-on-surface" : "text-slate-neutral"
            }`}
          >
            Role Selection
          </span>
        </div>

        <div className="h-0.5 w-8 bg-surface-dim" />

        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === 3
                ? "bg-brand-primary text-white"
                : "bg-surface-dim text-slate-neutral"
            }`}
          >
            3
          </div>
          <span
            className={`text-xs font-semibold ${
              step === 3 ? "text-on-surface" : "text-slate-neutral"
            }`}
          >
            Verification
          </span>
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
                  <span>Submitting Details...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: OTP Verification */}
      {step === 3 && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-on-surface">
                Verify Your Account
              </h3>
              <p className="text-xs text-slate-neutral mt-1">
                We sent a 6-digit verification code to{" "}
                <strong className="text-on-surface font-semibold">{maskedDestination}</strong>
              </p>
            </div>
          </div>

          {/* 6-Digit OTP Code Input */}
          <div className="space-y-2">
            <label className="block text-center text-xs font-semibold text-on-surface">
              Enter 6-Digit Code
            </label>
            <div className="relative flex justify-center">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 6) setOtp(val);
                }}
                placeholder="••••••"
                className="w-48 h-12 text-center text-2xl font-mono tracking-[0.5em] rounded border border-surface-dim bg-white text-on-surface placeholder:text-slate-neutral/40 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-all"
                autoFocus
                required
              />
            </div>
            <div className="flex items-center justify-between text-xs px-2 text-slate-neutral">
              <span>
                {expiresIn > 0 ? (
                  <>Expires in <strong className="text-on-surface font-mono">{formatTime(expiresIn)}</strong></>
                ) : (
                  <span className="text-status-error font-semibold">Code Expired</span>
                )}
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
                className="inline-flex items-center gap-1 font-semibold text-brand-primary hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {isResending ? (
                  <>
                    <RotateCw className="h-3 w-3 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <>
                    <RotateCw className="h-3 w-3" />
                    <span>Resend Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full gap-2"
              disabled={isVerifying || otp.length !== 6 || expiresIn <= 0}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Account...</span>
                </>
              ) : (
                <>
                  <span>Verify & Complete Registration</span>
                  <Check className="h-4 w-4" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
                setInfoMessage(null);
              }}
              className="w-full text-center text-xs text-slate-neutral hover:text-on-surface hover:underline transition-colors"
            >
              Need to edit email or details? Return to step 1
            </button>
          </div>
        </form>
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
