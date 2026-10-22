'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { getAuthorizedAdmin } from "@/lib/auth";
import { NOT_AUTHORIZED, type ActionResult } from "@/lib/action-result";
import { isOrderStatus, parseOrderNumber } from "@/lib/orders";
import { toCsv, type CsvExportResult } from "@/lib/csv";
import { parseForm } from "@/lib/validation/form";
import { orderNoteSchema } from "@/lib/validation/order";

export async function updateOrderStatus(orderId: number, newStatus: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return NOT_AUTHORIZED;

    if (!Number.isInteger(orderId) || !isOrderStatus(newStatus)) {
        return { success: false, message: "Invalid order or status." };
    }

    // Get current status before update
    const { data: order } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

    if (!order) {
        return { success: false, message: "Order not found." };
    }

    // Update the order status
    const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        console.error("Error updating order status:", error);
        return { success: false, message: `Failed to update status: ${error.message}` };
    }

    // Log status change to history
    await supabaseAdmin.from('order_status_history').insert({
        order_id: orderId,
        old_status: order.status,
        new_status: newStatus,
        changed_by: admin.id,
    });

    revalidatePath("/order");
    revalidatePath(`/order/${orderId}`);
    return { success: true, message: `Order marked as ${newStatus}.` };
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
export async function addOrderNote(orderId: number, note: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return NOT_AUTHORIZED;

    if (!Number.isInteger(orderId)) {
        return { success: false, message: "Order not found." };
    }

    const parsed = parseForm(orderNoteSchema, { note });
    if (!parsed.success) {
        return { success: false, message: parsed.message };
    }

    const { error } = await supabaseAdmin.from('order_notes').insert({
        order_id: orderId,
        admin_id: admin.id,
        note: parsed.data.note,
    });

    if (error) {
        console.error("Error adding order note:", error);
        return { success: false, message: `Failed to add note: ${error.message}` };
    }

    revalidatePath(`/order/${orderId}`);
    return { success: true, message: "Note added." };
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

const EXPORT_BATCH = 1000; // Supabase returns at most 1000 rows per request
const EXPORT_MAX_ROWS = 50_000;

// "2025-12-21T10:00:00.123+00:00" -> "2025-12-21 10:00:00", which spreadsheets read as a date
function formatUtc(timestamp: string) {
    return new Date(timestamp).toISOString().replace("T", " ").slice(0, 19);
}

// Every order matching the list's search and status filter, as a CSV file.
export async function exportOrders({
    search = "",
    status = "",
}: {
    search?: string;
    status?: string;
}): Promise<CsvExportResult> {
    if (!(await getAuthorizedAdmin("viewer"))) return NOT_AUTHORIZED;

    const orderId = search.trim() ? parseOrderNumber(search) : null;
    const statusFilter = isOrderStatus(status) ? status : null;
    const rows: unknown[][] = [];

    // As in the list, search text that isn't an order number matches nothing
    if (!search.trim() || orderId !== null) {
        for (let from = 0; from < EXPORT_MAX_ROWS; from += EXPORT_BATCH) {
            // Sorting by id as well keeps the batches from overlapping
            let query = supabaseAdmin
                .from('orders')
                .select('id, created_at, status, total')
                .order('created_at', { ascending: false })
                .order('id', { ascending: false })
                .range(from, from + EXPORT_BATCH - 1);

            if (orderId !== null) query = query.eq('id', orderId);
            if (statusFilter) query = query.eq('status', statusFilter);

            const { data, error } = await query;

            if (error) {
                console.error("Error exporting orders:", error);
                return { success: false, message: `Export failed: ${error.message}` };
            }

            for (const order of data) {
                rows.push([order.id, formatUtc(order.created_at), order.status, order.total]);
            }

            if (data.length < EXPORT_BATCH) break;
        }
    }

    const truncated = rows.length >= EXPORT_MAX_ROWS;
    const date = new Date().toISOString().slice(0, 10);

    return {
        success: true,
        message: truncated
            ? `Exported the first ${rows.length} orders.`
            : `Exported ${rows.length} order${rows.length === 1 ? "" : "s"}.`,
        csv: toCsv(["Order #", "Created at (UTC)", "Status", "Total (DZD)"], rows),
        filename: `orders${statusFilter ? `-${statusFilter.toLowerCase()}` : ""}-${date}.csv`,
    };
}
