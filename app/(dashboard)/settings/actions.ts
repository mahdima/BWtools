"use server";

import { createClient } from "@/utils/supabase/server";
import { getAuthorizedAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/validation/form";
import { passwordChangeSchema } from "@/lib/validation/admin";

export async function updatePassword(formData: FormData) {
  // Any active admin may change their own password.
  if (!(await getAuthorizedAdmin("viewer"))) {
    return { success: false, message: "Not authorized" };
  }

  // Same rules as new admin accounts: 8 to 72 characters, and both fields must match
  const parsed = parseForm(passwordChangeSchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Password updated successfully" };
}
