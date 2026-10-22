import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// All customers (mobile-app users) with their auth email and phone.
// Server-side paging comes in P6-04.
export async function getCustomers() {
  const { data, error } = await supabaseAdmin.from("profiles_with_email").select("*");

  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }

  // The view's columns are all nullable; a row without an id can't be edited, so skip it
  return (data || []).flatMap((item) =>
    item.id ? [{ id: item.id, username: item.username, email: item.email, phone: item.phone }] : [],
  );
}
