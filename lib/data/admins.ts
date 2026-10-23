import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isRole } from "@/lib/roles";

// All admins for the Team page, newest first, with their email.
export async function getTeamMembers() {
  const { data, error } = await supabaseAdmin
    .from("admins")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching team members:", error);
    return [];
  }

  // `admins` has no email column, so read each member's email from their auth user
  // (a team is a handful of people, so one lookup each is fine)
  const emails = await Promise.all(
    (data || []).map(async (member) => {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(member.id);
      return authData?.user?.email;
    }),
  );

  // A missing or unknown role is shown as viewer and a null is_active as active,
  // matching what lib/auth enforces
  return (data || []).map((member, index) => ({
    ...member,
    email: emails[index],
    role: isRole(member.role) ? member.role : "viewer",
    is_active: member.is_active !== false,
  }));
}
