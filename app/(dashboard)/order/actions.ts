'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function updateOrderStatus(orderId: string, newStatus: string) {
    if (!orderId || !newStatus) {
        throw new Error("Order ID and status are required");
    }

    // Get current user for logging
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
        order_id: parseInt(orderId),
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: user?.id,
    });

    revalidatePath("/order");
    revalidatePath(`/order/${orderId}`);
}

// Get order status history
export async function getOrderTimeline(orderId: string) {
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
export async function addOrderNote(orderId: string, note: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("You must be logged in to add notes");
    }

    const { error } = await supabaseAdmin.from('order_notes').insert({
        order_id: parseInt(orderId),
        admin_id: user.id,
        note,
    });

    if (error) {
        console.error("Error adding order note:", error);
        throw new Error(`Failed to add note: ${error.message}`);
    }

    revalidatePath(`/order/${orderId}`);
}

// Get all notes for an order
export async function getOrderNotes(orderId: string) {
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
