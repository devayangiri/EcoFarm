"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  Loader2,
  Check,
  ShieldCheck,
  RotateCw,
  CheckCircle2,
  KeyRound,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordField } from "./password-field";
import { AuthError } from "./auth-error";

export function ForgotPasswordForm() {
  // Wizard steps: 1 = Request Code, 2 = Verify OTP, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [maskedDestination, setMaskedDestination] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Timers and loading states
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [expiresIn, setExpiresIn] = useState<number>(600); // 10 minutes (600 seconds)
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Interval timer for OTP step
  useEffect(() => {
    if (step !== 2) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    let score = 0;
    const checks = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };

    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    let label = "Weak";
    let colorClass = "bg-status-error";
    let textClass = "text-status-error";

    if (score <= 2) {
      label = "Weak";
      colorClass = "bg-status-error";
      textClass = "text-status-error";
    } else if (score === 3) {
      label = "Fair";
      colorClass = "bg-status-warning";
      textClass = "text-status-warning";
    } else if (score === 4) {
      label = "Good";
      colorClass = "bg-brand-secondary";
      textClass = "text-brand-secondary";
    } else if (score >= 5) {
      label = "Strong";
      colorClass = "bg-status-success";
      textClass = "text-status-success";
    }

    return { score, label, colorClass, textClass, checks };
  }, [newPassword]);

  // Step 1: Request Password Reset OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError("Please enter your registered email or mobile number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmed }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || "Failed to process request. Please try again.");
        setIsLoading(false);
        return;
      }

      setMaskedDestination(result.data?.destination || trimmed);
      setResendCooldown(60);
      setExpiresIn(600);
      setOtp("");
      setIsLoading(false);
      setStep(2);
    } catch {
      setError("Unable to connect to the server. Please check your network and try again.");
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setError(null);
    setInfoMessage(null);
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || "Failed to resend code. Please wait a moment.");
        setIsResending(false);
        return;
      }

      setResendCooldown(60);
      setExpiresIn(600);
      setInfoMessage("A new verification code has been dispatched!");
      setIsResending(false);
    } catch {
      setError("Unable to connect to server. Please check your network.");
      setIsResending(false);
    }
  };

  // Step 2: Verify OTP
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

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: cleanOtp,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || "Invalid or expired verification code. Please try again.");
        setIsLoading(false);
        return;
      }

      setResetToken(result.data.resetToken);
      setIsLoading(false);
      setStep(3);
    } catch {
      setError("Unable to connect to the server. Please check your network and try again.");
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("Password must include uppercase, lowercase, and numeric characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || "Failed to reset password. Please try again.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep(4);
    } catch {
      setError("Unable to connect to the server. Please check your network and try again.");
      setIsLoading(false);
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

      {/* Progress Stepper */}
      {step < 4 && (
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
            <span className="text-xs font-semibold text-on-surface">Account</span>
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
              Verify OTP
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
              New Password
            </span>
          </div>
        </div>
      )}

      {/* STEP 1: Identifier Input */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="space-y-1 text-center pb-1">
            <h3 className="font-heading text-base font-bold text-on-surface">
              Password Recovery
            </h3>
            <p className="text-xs text-slate-neutral">
              Enter registered email or mobile number
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface">
              Email or mobile number
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-neutral/70">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com or +91 98765 43210"
                className="w-full h-10 pl-9 pr-3 rounded border border-surface-dim bg-white text-sm text-on-surface placeholder:text-slate-neutral/50 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-all"
                autoFocus
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full gap-2 mt-2"
            disabled={isLoading || !identifier.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send Verification Code</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* STEP 2: OTP Verification */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-on-surface">
                Verification Code
              </h3>
              <p className="text-xs text-slate-neutral mt-1">
                Enter the 6-digit code sent to{" "}
                <strong className="text-on-surface font-semibold">{maskedDestination}</strong>
              </p>
            </div>
          </div>

          {/* 6-Digit Code Input */}
          <div className="space-y-2">
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
              disabled={isLoading || otp.length !== 6 || expiresIn <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP</span>
                  <ArrowRight className="h-4 w-4" />
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
              Entered wrong details? Try another email or phone
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: New Password Creation */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="text-center space-y-1 pb-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-base font-bold text-on-surface">
              New Password
            </h3>
            <p className="text-xs text-slate-neutral">
              Create a new secure password for your account
            </p>
          </div>

          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters with numbers & letters"
            required
          />

          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <div className="space-y-2 p-2.5 rounded bg-surface-low border border-surface-dim text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-neutral font-medium">Password Strength:</span>
                <span className={`font-bold ${passwordStrength.textClass}`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="flex gap-1 h-1.5 w-full">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`flex-1 rounded-full transition-colors ${
                      passwordStrength.score >= bar
                        ? passwordStrength.colorClass
                        : "bg-surface-dim"
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-slate-neutral">
                <span className={passwordStrength.checks.length ? "text-status-success font-medium" : ""}>
                  {passwordStrength.checks.length ? "✓" : "•"} 8+ characters
                </span>
                <span className={passwordStrength.checks.uppercase ? "text-status-success font-medium" : ""}>
                  {passwordStrength.checks.uppercase ? "✓" : "•"} 1 uppercase letter
                </span>
                <span className={passwordStrength.checks.lowercase ? "text-status-success font-medium" : ""}>
                  {passwordStrength.checks.lowercase ? "✓" : "•"} 1 lowercase letter
                </span>
                <span className={passwordStrength.checks.number ? "text-status-success font-medium" : ""}>
                  {passwordStrength.checks.number ? "✓" : "•"} 1 number
                </span>
              </div>
            </div>
          )}

          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full gap-2 mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <Check className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* STEP 4: Success Confirmation */}
      {step === 4 && (
        <div className="space-y-5 text-center py-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-success/15 text-status-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-lg font-bold text-on-surface">
              Password has been successfully reset.
            </h3>
            <p className="text-xs text-slate-neutral leading-relaxed">
              All active sessions across devices have been securely signed out. You can now sign in with your new password.
            </p>
          </div>

          <Link href="/login" className="block pt-2">
            <Button variant="primary" size="lg" className="w-full gap-2">
              <span>Proceed to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Switch to Sign In */}
      {step < 4 && (
        <div className="text-center pt-3 border-t border-surface-dim text-xs text-slate-neutral">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-brand-primary hover:underline">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
