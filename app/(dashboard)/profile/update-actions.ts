"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateAdminProfile(prevState: any, formData: FormData) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return { success: false, message: "Unauthorized" };
  }

  const fullName = (formData.get("fullName") as string | null)?.trim();
  const email = formData.get("email") as string; // Standard auth update

  if (!fullName) {
    return { success: false, message: "Full name is required." };
  }

  // 1. Update the admin's own row. The id comes from the session, never from the form,
  // and role / active status are only changed by super admins on the Team page.
  const { error: profileError } = await supabaseAdmin
    .from("admins")
    .update({ full_name: fullName })
    .eq("id", admin.id);

  if (profileError) {
    return { success: false, message: "Failed to update profile details: " + profileError.message };
  }

  // 2. Sync to Auth Metadata for extra redundancy
  const supabase = await createClient();
  await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  // 3. Update Auth Email if changed
  if (email && email !== admin.email) {
    const { error: authError } = await supabase.auth.updateUser({ email });
    if (authError) {
      revalidatePath("/", "layout"); // Ensure layout updates
      return { success: true, message: "Profile updated, but email update failed: " + authError.message };
    }
    // Note: This usually triggers a confirmation email to the new address.
    revalidatePath("/", "layout");
    return { success: true, message: "Profile updated. Please check your new email for a confirmation link." };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Profile updated successfully." };
}
