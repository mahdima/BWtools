'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isOrderStatus } from "@/lib/orders";
import { parseForm } from "@/lib/validation/form";
import { orderNoteSchema } from "@/lib/validation/order";

export async function updateOrderStatus(orderId: number, newStatus: string) {
    const admin = await requireAdmin("admin");

    if (!Number.isInteger(orderId) || !newStatus) {
        throw new Error("Order ID and status are required");
    }

    if (!isOrderStatus(newStatus)) {
        throw new Error(`Invalid order status: ${newStatus}`);
    }

    // Get current status before update
    const { data: order } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

    const oldStatus = order?.status;

    // Update the order status
    const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        console.error("Error updating order status:", error);
        throw new Error(`Failed to update status: ${error.message}`);
    }

    // Log status change to history
    await supabaseAdmin.from('order_status_history').insert({
        order_id: orderId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: admin.id,
    });

    revalidatePath("/order");
    revalidatePath(`/order/${orderId}`);
}

// Get order status history
export async function getOrderTimeline(orderId: number) {
    const { data, error } = await supabaseAdmin
        .from('order_status_history')
        .select('*, admins(full_name)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching order timeline:", error);
        return [];
    }
    return data || [];
}

// Add internal note to order
export async function addOrderNote(orderId: number, note: string) {
    const admin = await requireAdmin("admin");

    if (!Number.isInteger(orderId)) {
        throw new Error("Order ID is required");
    }

    const parsed = parseForm(orderNoteSchema, { note });
    if (!parsed.success) {
        throw new Error(parsed.message);
    }

    const { error } = await supabaseAdmin.from('order_notes').insert({
        order_id: orderId,
        admin_id: admin.id,
        note: parsed.data.note,
    });

    if (error) {
        console.error("Error adding order note:", error);
        throw new Error(`Failed to add note: ${error.message}`);
    }

    revalidatePath(`/order/${orderId}`);
}

// Get all notes for an order
export async function getOrderNotes(orderId: number) {
    const { data, error } = await supabaseAdmin
        .from('order_notes')
        .select('*, admins(full_name)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching order notes:", error);
        return [];
    }
    return data || [];
}
