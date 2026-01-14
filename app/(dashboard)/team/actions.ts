'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@/utils/supabase/server";
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
  
  // Add default role if column doesn't exist yet
  return (data || []).map(member => ({
    ...member,
    role: member.role || 'admin',
  }));
}

// Check if current user is super admin
export async function isSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabaseAdmin
    .from('admins')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role === 'super_admin';
}

// Get current user's role
export async function getCurrentUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabaseAdmin
    .from('admins')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role || 'viewer';
}

// Create new admin (super admin only)
export async function createAdmin(formData: FormData) {
  // Verify current user is super admin
  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    throw new Error("Only super admins can create new accounts");
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as string;

  if (!email || !password || !fullName || !role) {
    throw new Error("All fields are required");
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
  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    throw new Error("Only super admins can change roles");
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
  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    throw new Error("Only super admins can deactivate accounts");
  }

  // Prevent deactivating yourself
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === adminId) {
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

  revalidatePath('/team');
}

// Reactivate admin (super admin only)
export async function reactivateAdmin(adminId: string) {
  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    throw new Error("Only super admins can reactivate accounts");
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
