import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// The latest 20 notifications for one admin.
export async function getNotifications(adminId: string) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data || [];
}
