'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentAdmin, requireAdmin } from "@/lib/auth";
import { isRole } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Get all team members
export async function getTeamMembers() {
  const { data, error } = await supabaseAdmin
    .from('admins')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
  
  // A missing or unknown role is shown as viewer and a null is_active as active,
  // matching what lib/auth enforces
  return (data || []).map(member => ({
    ...member,
    role: isRole(member.role) ? member.role : 'viewer',
    is_active: member.is_active !== false,
  }));
}

// Check if current user is super admin
export async function isSuperAdmin() {
  const admin = await getCurrentAdmin();
  return admin?.role === 'super_admin';
}

// Get current user's role
export async function getCurrentUserRole() {
  const admin = await getCurrentAdmin();
  return admin?.role ?? null;
}

// Create new admin (super admin only)
export async function createAdmin(formData: FormData) {
  await requireAdmin('super_admin');

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as string;

  if (!email || !password || !fullName || !role) {
    throw new Error("All fields are required");
  }

  if (!isRole(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error("Error creating auth user:", authError);
    throw new Error(`Failed to create user: ${authError.message}`);
  }

  // Create admin record
  const { error: adminError } = await supabaseAdmin.from('admins').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    role,
    is_active: true,
  });

  if (adminError) {
    console.error("Error creating admin record:", adminError);
    // Clean up auth user if admin creation fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Failed to create admin: ${adminError.message}`);
  }

  revalidatePath('/team');
  redirect('/team');
}

// Update admin role (super admin only)
export async function updateAdminRole(adminId: string, newRole: string) {
  const admin = await requireAdmin('super_admin');

  if (!isRole(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }

  // Prevent a super admin from demoting themselves (and leaving no super admin)
  if (admin.id === adminId) {
    throw new Error("You cannot change your own role");
  }

  const { error } = await supabaseAdmin
    .from('admins')
    .update({ role: newRole })
    .eq('id', adminId);

  if (error) {
    console.error("Error updating role:", error);
    throw new Error(`Failed to update role: ${error.message}`);
  }

  revalidatePath('/team');
}

// Deactivate admin (super admin only)
export async function deactivateAdmin(adminId: string) {
  const admin = await requireAdmin('super_admin');

  // Prevent deactivating yourself
  if (admin.id === adminId) {
    throw new Error("You cannot deactivate your own account");
  }

  const { error } = await supabaseAdmin
    .from('admins')
    .update({ is_active: false })
    .eq('id', adminId);

  if (error) {
    console.error("Error deactivating admin:", error);
    throw new Error(`Failed to deactivate: ${error.message}`);
  }

  // Also block the account from signing in anywhere (~100 years; undone on reactivate).
  // If this fails the admin is still locked out of the dashboard by `is_active`.
  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
    ban_duration: '876000h',
  });

  if (banError) {
    console.error("Error banning deactivated admin:", banError);
    revalidatePath('/team');
    throw new Error(`Deactivated, but failed to block sign-in: ${banError.message}`);
  }

  revalidatePath('/team');
}

// Reactivate admin (super admin only)
export async function reactivateAdmin(adminId: string) {
  await requireAdmin('super_admin');

  // Lift the sign-in ban first, so a failure leaves the account fully deactivated
  const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
    ban_duration: 'none',
  });

  if (unbanError) {
    console.error("Error lifting ban on admin:", unbanError);
    throw new Error(`Failed to reactivate: ${unbanError.message}`);
  }

  const { error } = await supabaseAdmin
    .from('admins')
    .update({ is_active: true })
    .eq('id', adminId);

  if (error) {
    console.error("Error reactivating admin:", error);
    throw new Error(`Failed to reactivate: ${error.message}`);
  }

  revalidatePath('/team');
}
