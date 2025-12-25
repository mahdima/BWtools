"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export async function updateCustomer(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const username = formData.get("username") as string;
  const phone = formData.get("phone") as string;

  if (!id) {
    return { success: false, message: "Customer ID is required" };
  }

  // 1. Update Username in Profiles (if username is changed)
  // We use the regular client for this table update (assuming RLS allows it or we use admin if needed)
  // Usage of admin for profiles is safer if RLS is strict for other users editing.
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      username: username || null,
    })
    .eq("id", id);

  if (profileError) {
    // If phone didn't fail but profile did, we still report error.
    return { success: false, message: "Failed to update profile: " + profileError.message };
  }

  // 2. Update Phone in Auth Users (admin only)
  if (phone) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { phone: phone }
    );

    if (authError) {
      return { success: false, message: "Failed to update phone: " + authError.message };
    }
  }

  revalidatePath("/customers");
  return { success: true, message: "Customer updated successfully" };
}
