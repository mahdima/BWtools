'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Mark a notification as read
export async function markNotificationAsRead(notificationId: number) {
  const admin = await requireAdmin("viewer");

  // Only the owner's notification: another admin's id simply matches no row
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('admin_id', admin.id);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }

  revalidatePath('/');
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const admin = await getAuthorizedAdmin("viewer");

  if (!admin) return;

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('admin_id', admin.id)
    .eq('is_read', false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Failed to mark all as read");
  }

  revalidatePath('/');
}

// New-order and low-stock notifications are created by database triggers
// (docs/sql/P6-02-notification-triggers.sql), not from the dashboard.
