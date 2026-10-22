"use server";

import { createClient } from "@/utils/supabase/server";
import { getAuthorizedAdmin } from "@/lib/auth";

export async function updatePassword(formData: FormData) {
  // Any active admin may change their own password.
  if (!(await getAuthorizedAdmin("viewer"))) {
    return { success: false, message: "Not authorized" };
  }

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" };
  }

  // Same minimum as new admin accounts (team/new)
  if (!password || password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Password updated successfully" };
}
