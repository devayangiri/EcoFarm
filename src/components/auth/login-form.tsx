"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordField } from "./password-field";
import { AuthError } from "./auth-error";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Please enter your email or phone number");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || "Invalid email/phone or password");
        setIsLoading(false);
        return;
      }

      // Successful login -> Redirect to role dashboard or callbackUrl
      const targetUrl = callbackUrl || result.data.redirectUrl || "/";
      window.location.href = targetUrl;
    } catch {
      setError("Unable to connect to the server. Please check your network and try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <AuthError message={error} onDismiss={() => setError(null)} />

      {/* Identifier (Email / Phone) */}
      <div className="space-y-1.5 font-body">
        <label className="block text-xs font-semibold text-on-surface">
          Email or Phone Number
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-neutral/70">
            <Mail className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. farmer@agriaqua.dev or +919876543210"
            className="w-full h-10 pl-9 pr-3 rounded border border-surface-dim bg-white text-sm text-on-surface placeholder:text-slate-neutral/50 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-all"
            disabled={isLoading}
            autoComplete="username"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1">
        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your account password"
          disabled={isLoading}
          autoComplete="current-password"
          required
        />
        <div className="flex justify-end pt-1">
          <Link
            href="/forgot-password"
            className="text-[11px] font-semibold text-brand-secondary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Submit Button */}
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
            <span>Signing In...</span>
          </>
        ) : (
          <>
            <span>Sign In to EcoFarm</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      {/* Switch to Register */}
      <div className="text-center pt-3 border-t border-surface-dim text-xs text-slate-neutral">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className="font-semibold text-brand-primary hover:underline">
          Create Account
        </Link>
      </div>
    </form>
  );
}
