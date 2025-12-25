"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export async function updateAdminProfile(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as string;
  const email = formData.get("email") as string; // Standard auth update
  // const isActive = formData.get("isActive") === "on"; // You generally don't edit your own active status to false, but let's leave it for now or omit.

  if (id !== user.id) {
    return { success: false, message: "You can only edit your own profile." };
  }

  // 1. Update/Create Admins Table
  // Using supabaseAdmin to bypass RLS recursion issues
  // Using upsert to handle cases where the admin row hasn't been created yet (e.g. manual SQL users)
  const { error: profileError } = await supabaseAdmin
    .from("admins")
    .upsert({
      id: id,
      full_name: fullName,
      role: role,
      // is_active: true, // Ensuring active if creating
    }, { onConflict: 'id' });

  if (profileError) {
    return { success: false, message: "Failed to update profile details: " + profileError.message };
  }

  // 2. Sync to Auth Metadata for extra redundancy
  await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  // 3. Update Auth Email if changed
  if (email && email !== user.email) {
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
