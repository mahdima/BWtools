import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hasRole, isRole, type Role } from "@/lib/roles";

export type CurrentAdmin = {
  id: string;
  email: string | undefined;
  full_name: string | null;
  role: Role;
  created_at: string | null;
};

// The `admins` row for `userId` if it grants dashboard access, otherwise null.
// Rows created by hand may have a null `is_active`, which counts as active.
export async function findActiveAdmin(userId: string) {
  const { data: admin, error } = await supabaseAdmin
    .from("admins")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error loading admin record:", error);
    return null;
  }

  if (!admin || admin.is_active === false) return null;

  return admin;
}

// The signed-in user's admin record, or null when there is no session, no `admins` row,
// or the admin is deactivated. Cached so a request only resolves it once.
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = await findActiveAdmin(user.id);
  if (!admin) return null;

  // An unknown or missing role falls back to the least privileged one.
  return {
    id: admin.id,
    email: user.email,
    full_name: admin.full_name ?? null,
    role: isRole(admin.role) ? admin.role : "viewer",
    created_at: admin.created_at ?? null,
  };
});

// The current admin if they have at least `minRole`, otherwise null. For actions that
// report errors as `{ success: false, message }` instead of throwing.
export async function getAuthorizedAdmin(minRole: Role = "viewer"): Promise<CurrentAdmin | null> {
  const admin = await getCurrentAdmin();
  return admin && hasRole(admin.role, minRole) ? admin : null;
}

// For server actions: throws unless the caller is an active admin with at least `minRole`.
export async function requireAdmin(minRole: Role = "viewer"): Promise<CurrentAdmin> {
  const admin = await getAuthorizedAdmin(minRole);

  if (!admin) {
    throw new Error("Not authorized");
  }

  return admin;
}

// For pages and layouts: redirects non-admins to login and under-privileged admins home.
export async function requireAdminPage(minRole: Role = "viewer"): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();

  if (!admin) redirect("/login?error=unauthorized");
  if (!hasRole(admin.role, minRole)) redirect("/");

  return admin;
}
