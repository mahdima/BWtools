"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getAdminProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  /* Use supabaseAdmin to ensure we can read the profile even if RLS is strict */
  const { data: adminFile, error } = await supabaseAdmin
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !adminFile) {
    // Fallback if admin profile doesn't exist yet, return basic auth info
    return {
      id: user.id,
      full_name: user.user_metadata?.full_name || "Admin",
      email: user.email,
      role: "viewer", // Default safe role
      is_active: true,
      created_at: new Date().toISOString(),
    };
  }

  return {
    ...adminFile,
    email: user.email,
  };
}
