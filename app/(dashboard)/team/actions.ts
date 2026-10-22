'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { NOT_AUTHORIZED, type ActionResult } from "@/lib/action-result";
import { isRole } from "@/lib/roles";
import { parseForm } from "@/lib/validation/form";
import { adminCreateSchema } from "@/lib/validation/admin";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Create new admin (super admin only)
// Form action (via useFormAction): returns an error to show, or redirects on success.
export async function createAdmin(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin('super_admin');
  if (!admin) return NOT_AUTHORIZED;

  const parsed = parseForm(adminCreateSchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { email, password, fullName, role } = parsed.data;

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error("Error creating auth user:", authError);
    return { success: false, message: `Failed to create user: ${authError.message}` };
  }

  // Create admin record
  // `admins` has no email column: the email lives on the auth user created above
  const { error: adminError } = await supabaseAdmin.from('admins').insert({
    id: authData.user.id,
    full_name: fullName,
    role,
    is_active: true,
  });

  if (adminError) {
    console.error("Error creating admin record:", adminError);
    // Clean up auth user if admin creation fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return { success: false, message: `Failed to create admin: ${adminError.message}` };
  }

  logAudit(admin.id, "create", "admin", authData.user.id, { full_name: fullName, role });
  revalidatePath('/team');
  redirect('/team');
}

// Update admin role (super admin only)
export async function updateAdminRole(adminId: string, newRole: string): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin('super_admin');
  if (!admin) return NOT_AUTHORIZED;

  if (!isRole(newRole)) {
    return { success: false, message: `Invalid role: ${newRole}` };
  }

  // Prevent a super admin from demoting themselves (and leaving no super admin)
  if (admin.id === adminId) {
    return { success: false, message: "You cannot change your own role." };
  }

  // The previous role, for the audit log
  const { data: target } = await supabaseAdmin.from('admins').select('role').eq('id', adminId).maybeSingle();
  if (!target) {
    return { success: false, message: "Admin not found." };
  }

  const { error } = await supabaseAdmin
    .from('admins')
    .update({ role: newRole })
    .eq('id', adminId);

  if (error) {
    console.error("Error updating role:", error);
    return { success: false, message: `Failed to update role: ${error.message}` };
  }

  logAudit(admin.id, "role_change", "admin", adminId, { role: { from: target.role, to: newRole } });
  revalidatePath('/team');
  return { success: true, message: "Role updated." };
}

// Deactivate admin (super admin only)
export async function deactivateAdmin(adminId: string): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin('super_admin');
  if (!admin) return NOT_AUTHORIZED;

  // Prevent deactivating yourself
  if (admin.id === adminId) {
    return { success: false, message: "You cannot deactivate your own account." };
  }

  const { error } = await supabaseAdmin
    .from('admins')
    .update({ is_active: false })
    .eq('id', adminId);

  if (error) {
    console.error("Error deactivating admin:", error);
    return { success: false, message: `Failed to deactivate: ${error.message}` };
  }

  logAudit(admin.id, "deactivate", "admin", adminId);

  // Also block the account from signing in anywhere (~100 years; undone on reactivate).
  // If this fails the admin is still locked out of the dashboard by `is_active`.
  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
    ban_duration: '876000h',
  });

  revalidatePath('/team');

  if (banError) {
    console.error("Error banning deactivated admin:", banError);
    return { success: false, message: `Deactivated, but failed to block sign-in: ${banError.message}` };
  }

  return { success: true, message: "Admin deactivated." };
}

// Reactivate admin (super admin only)
export async function reactivateAdmin(adminId: string): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin('super_admin');
  if (!admin) return NOT_AUTHORIZED;

  // Lift the sign-in ban first, so a failure leaves the account fully deactivated
  const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
    ban_duration: 'none',
  });

  if (unbanError) {
    console.error("Error lifting ban on admin:", unbanError);
    return { success: false, message: `Failed to reactivate: ${unbanError.message}` };
  }

  const { error } = await supabaseAdmin
    .from('admins')
    .update({ is_active: true })
    .eq('id', adminId);

  if (error) {
    console.error("Error reactivating admin:", error);
    return { success: false, message: `Failed to reactivate: ${error.message}` };
  }

  logAudit(admin.id, "reactivate", "admin", adminId);
  revalidatePath('/team');
  return { success: true, message: "Admin reactivated." };
}
