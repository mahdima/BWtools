'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Get notifications for current user
export async function getNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data || [];
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: number) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }

  revalidatePath('/');
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('admin_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Failed to mark all as read");
  }

  revalidatePath('/');
}

// Create a notification (used by other server actions)
export async function createNotification({
  adminId,
  type,
  title,
  message,
  link,
}: {
  adminId: string;
  type: 'new_order' | 'low_stock' | 'system';
  title: string;
  message: string;
  link?: string;
}) {
  const { error } = await supabaseAdmin.from('notifications').insert({
    admin_id: adminId,
    type,
    title,
    message,
    link,
  });

  if (error) {
    console.error("Error creating notification:", error);
  }
}

// Notify all admins about a new order
export async function notifyNewOrder(orderId: number, orderTotal: number) {
  // Get all admins
  const { data: admins } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('is_active', true);

  if (!admins) return;

  // Create notification for each admin
  for (const admin of admins) {
    await createNotification({
      adminId: admin.id,
      type: 'new_order',
      title: 'New Order Received',
      message: `Order #${orderId} for ${orderTotal.toLocaleString()} DZD`,
      link: `/order/${orderId}`,
    });
  }
}
