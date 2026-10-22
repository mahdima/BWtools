import { z } from "zod";

// Fields posted by components/CustomerForm.tsx.
export const customerSchema = z.object({
  id: z.uuid("Customer not found."),
  username: z.string().trim().max(50, "Username must be 50 characters or fewer.").optional(),
  // Optional; digits with optional leading +, spaces or dashes (e.g. +213 555 12 34 56).
  phone: z
    .string()
    .trim()
    .refine((phone) => phone === "" || /^\+?[0-9][0-9 -]{5,19}$/.test(phone), "Phone number is invalid.")
    .optional(),
});
