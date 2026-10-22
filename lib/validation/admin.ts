import { z } from "zod";
import { ROLES } from "@/lib/roles";

const fullName = z
  .string({ error: "Full name is required." })
  .trim()
  .min(1, "Full name is required.")
  .max(100, "Full name must be 100 characters or fewer.");

// Supabase Auth hashes with bcrypt, which only uses the first 72 bytes.
const password = z
  .string({ error: "Password is required." })
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

// app/(dashboard)/team/new: a super admin creating an account.
export const adminCreateSchema = z.object({
  fullName,
  email: z.email("Enter a valid email address."),
  password,
  role: z.enum(ROLES, "Choose a valid role."),
});

// components/profile-edit-dialog.tsx: an admin editing their own profile.
export const profileSchema = z.object({
  fullName,
  email: z.union([z.literal(""), z.email("Enter a valid email address.")]).optional(),
});

// components/SecurityForm.tsx: an admin changing their own password.
export const passwordChangeSchema = z
  .object({
    password,
    confirmPassword: z.string({ error: "Confirm your new password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });
