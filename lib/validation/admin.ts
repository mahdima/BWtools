import { z } from "zod";
import { ROLES } from "@/lib/roles";

const fullName = z
  .string({ error: "fullNameRequired" })
  .trim()
  .min(1, "fullNameRequired")
  .max(100, "fullNameTooLong");

// Supabase Auth hashes with bcrypt, which only uses the first 72 bytes.
const password = z
  .string({ error: "passwordRequired" })
  .min(8, "passwordTooShort")
  .max(72, "passwordTooLong");

// app/(dashboard)/team/new: a super admin creating an account.
export const adminCreateSchema = z.object({
  fullName,
  email: z.email("emailInvalid"),
  password,
  role: z.enum(ROLES, "roleInvalid"),
});

// components/profile-edit-dialog.tsx: an admin editing their own profile.
export const profileSchema = z.object({
  fullName,
  email: z.union([z.literal(""), z.email("emailInvalid")]).optional(),
});

// app/forgot-password: asking for a password reset email.
export const passwordResetRequestSchema = z.object({
  email: z.email("emailInvalid"),
});

// components/SecurityForm.tsx and app/reset-password: an admin setting a new password.
export const passwordChangeSchema = z
  .object({
    password,
    confirmPassword: z.string({ error: "confirmPasswordRequired" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "passwordsDontMatch",
    path: ["confirmPassword"],
  });
