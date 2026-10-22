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
  // Exported from a 'use server' file, so this is a public endpoint: only admins may call it.
  await requireAdmin("admin");

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
  await requireAdmin("admin");

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
