import { z } from "zod";

export const AddToCartSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z
    .number({ required_error: "Quantity is required" })
    .positive("Quantity must be greater than zero"),
});

export const UpdateCartItemSchema = z.object({
  quantity: z
    .number({ required_error: "Quantity is required" })
    .positive("Quantity must be greater than zero"),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;