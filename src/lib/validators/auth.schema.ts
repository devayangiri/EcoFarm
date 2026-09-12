import { z } from "zod";
import { PUBLIC_ROLES } from "@/types/role.types";

// Public role selection schema (strictly excludes ADMIN)
export const publicRoleSchema = z.enum(["FARMER", "BUYER", "AGENT", "SERVICE_PROVIDER"], {
  errorMap: () => ({ message: "Please select a valid role: Farmer, Buyer, Agent, or Service Provider" }),
});

// Full registration schema
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    phone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => !val || /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(val),
        { message: "Please provide a valid 10-15 digit phone number" }
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    role: publicRoleSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Please enter your email or phone number"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Role selection step schema
export const roleSelectSchema = z.object({
  role: publicRoleSchema,
});

export type RoleSelectInput = z.infer<typeof roleSelectSchema>;

// OTP verification for registration
export const verifyRegistrationOtpSchema = z.object({
  verificationToken: z.string().min(1, "Verification challenge token is required"),
  destination: z.string().min(3, "Destination address is required"),
  destinationType: z.enum(["EMAIL", "MOBILE"]).optional(),
  otp: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only digits"),
});

export type VerifyRegistrationOtpInput = z.infer<typeof verifyRegistrationOtpSchema>;

// OTP resend schema
export const resendOtpSchema = z.object({
  verificationToken: z.string().optional(),
  destination: z.string().optional(),
  destinationType: z.enum(["EMAIL", "MOBILE"]).optional(),
  purpose: z.enum(["REGISTRATION", "PASSWORD_RESET"]).default("REGISTRATION"),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

// Forgot password request schema
export const forgotPasswordRequestSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Please enter your registered email or mobile number"),
});

export type ForgotPasswordRequestInput = z.infer<typeof forgotPasswordRequestSchema>;

// Forgot password verify OTP schema
export const forgotPasswordVerifySchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Please enter your registered email or mobile number"),
  otp: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only digits"),
});

export type ForgotPasswordVerifyInput = z.infer<typeof forgotPasswordVerifySchema>;

// Reset password with authorization token schema
export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(10, "Invalid or missing reset authorization token"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
