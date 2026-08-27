import { z } from "zod";

export const PaymentMethodEnum = z.enum([
  "COD",
  "BANK_TRANSFER",
  "RAZORPAY",
  "STRIPE",
  "MOCK",
]);

export const ShippingAddressSchema = z.object({
  recipientName: z.string().min(2, "Recipient name is required").max(100),
  recipientPhone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Valid 10-12 digit phone required"),
  villageOrStreet: z.string().min(3, "Street address is required").max(200),
  cityOrTown: z.string().min(2, "City or town is required").max(100),
  district: z.string().min(2, "District is required").max(80),
  state: z.string().min(2, "State is required").max(80),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Valid 6-digit Indian PIN required"),
});

export const ConfirmCheckoutSchema = z.object({
  checkoutSessionId: z.string().uuid("Invalid checkout session ID"),
  paymentMethod: PaymentMethodEnum.default("COD"),
  shippingAddress: ShippingAddressSchema,
});

export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;
export type ConfirmCheckoutInput = z.infer<typeof ConfirmCheckoutSchema>;