'use server'

import { getTranslations } from "next-intl/server";
import { getBulkWords, notAuthorized, parseFormT } from "@/lib/server-messages";

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { getAuthorizedAdmin } from "@/lib/auth";
import { type ActionResult } from "@/lib/action-result";
import { isOrderStatus } from "@/lib/orders";
import { resolveOrderFilters, type OrderFilterInput } from "@/lib/data/orders";
import { toCsv, type CsvExportResult } from "@/lib/csv";
import { orderNoteSchema } from "@/lib/validation/order";
import { logAudit } from "@/lib/audit";
import { shorten } from "@/lib/audit-changes";
import { MAX_BULK, bulkResult, parseBulkIds } from "@/lib/bulk";

export async function updateOrderStatus(orderId: number, newStatus: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.orders");

    if (!Number.isInteger(orderId) || !isOrderStatus(newStatus)) {
        return { success: false, message: t("invalid") };
    }

    const error = await changeOrderStatus(admin.id, orderId, newStatus);
    if (error) return error;

    revalidatePath("/order");
    revalidatePath(`/order/${orderId}`);
    return { success: true, message: t("marked", { status: (await getTranslations("orderStatus"))(newStatus) }) };
}

// Bulk status change (P7-03): each order gets its own history entry and audit row.
export async function updateOrdersStatus(orderIds: number[], newStatus: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.orders");

    const ids = parseBulkIds(orderIds);
    if (!ids || !isOrderStatus(newStatus)) {
        return { success: false, message: t("bulkInvalid", { max: MAX_BULK }) };
    }

    let changed = 0;
    const failures: string[] = [];
    for (const id of ids) {
        const error = await changeOrderStatus(admin.id, id, newStatus);
        if (error) failures.push(`#${id}: ${error.message}`);
        else changed++;
    }

    if (changed) revalidatePath("/order");
    return bulkResult(
        changed ? [t("bulkMarked", { count: changed, status: (await getTranslations("orderStatus"))(newStatus) })] : [],
        failures,
        await getBulkWords(),
    );
}

// Changes one order's status and records it. Returns an error result, or null on success.
async function changeOrderStatus(adminId: string, orderId: number, newStatus: string): Promise<ActionResult | null> {
    const t = await getTranslations("actions.orders");
    // Status + history in one transaction (docs/sql/P6-05-set-order-status.sql). The
    // function isn't in the generated types until the owner applies it, hence the cast.
    const { error: rpcError } = await (supabaseAdmin as unknown as SupabaseClient).rpc("set_order_status", {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_admin_id: adminId,
    });

    if (rpcError?.code === "PGRST202") {
        // Function not installed yet: separate queries (not atomic)
        const fallback = await updateStatusWithoutTransaction(orderId, newStatus, adminId);
        if (fallback) return fallback;
    } else if (rpcError) {
        if (rpcError.code === "P0002") return { success: false, message: t("notFound") };
        console.error("Error updating order status:", rpcError);
        return { success: false, message: t("updateFailed", { error: rpcError.message }) };
    }

    logAudit(adminId, "status_change", "order", orderId, { status: { to: newStatus } });
    return null;
}

// The pre-P6-05 path: read, update, then write history. Returns an error result, or
// null on success. Used only until set_order_status exists in the database.
async function updateStatusWithoutTransaction(
    orderId: number,
    newStatus: string,
    adminId: string,
): Promise<ActionResult | null> {
    const t = await getTranslations("actions.orders");
    const { data: order } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .maybeSingle();

    if (!order) {
        return { success: false, message: t("notFound") };
    }

    const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        console.error("Error updating order status:", error);
        return { success: false, message: t("updateFailed", { error: error.message }) };
    }

    const { error: historyError } = await supabaseAdmin.from('order_status_history').insert({
        order_id: orderId,
        old_status: order.status,
        new_status: newStatus,
        changed_by: adminId,
    });
    if (historyError) {
        console.error("Status changed but its history entry failed:", historyError);
    }

    return null;
}

// Add internal note to order
export async function addOrderNote(orderId: number, note: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.orders");

    if (!Number.isInteger(orderId)) {
        return { success: false, message: t("notFound") };
    }

    const parsed = await parseFormT(orderNoteSchema, { note });
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
        return { success: false, message: t("noteFailed", { error: error.message }) };
    }

    logAudit(admin.id, "note", "order", orderId, { note: shorten(parsed.data.note) });
    revalidatePath(`/order/${orderId}`);
    return { success: true, message: t("noteAdded") };
}


const EXPORT_BATCH = 1000; // Supabase returns at most 1000 rows per request
const EXPORT_MAX_ROWS = 50_000;

// "2025-12-21T10:00:00.123+00:00" -> "2025-12-21 10:00:00", which spreadsheets read as a date
function formatUtc(timestamp: string) {
    return new Date(timestamp).toISOString().replace("T", " ").slice(0, 19);
}

// Every order matching the list's search and status filter, as a CSV file.
export async function exportOrders(filterInput: OrderFilterInput): Promise<CsvExportResult> {
    const admin = await getAuthorizedAdmin("viewer");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.orders");

    // Same filters as the list (search, status, date range)
    const filters = await resolveOrderFilters(filterInput);
    const rows: unknown[][] = [];

    if (!filters.matchesNothing) {
        for (let from = 0; from < EXPORT_MAX_ROWS; from += EXPORT_BATCH) {
            // Sorting by id as well keeps the batches from overlapping
            let query = supabaseAdmin
                .from('orders')
                .select('id, created_at, status, total')
                .order('created_at', { ascending: false })
                .order('id', { ascending: false })
                .range(from, from + EXPORT_BATCH - 1);

            if (filters.searchClause) query = query.or(filters.searchClause);
            if (filters.status) query = query.eq('status', filters.status);
            if (filters.createdFrom) query = query.gte('created_at', filters.createdFrom);
            if (filters.createdBefore) query = query.lt('created_at', filters.createdBefore);

            const { data, error } = await query;

            if (error) {
                console.error("Error exporting orders:", error);
                return { success: false, message: t("exportFailed", { error: error.message }) };
            }

            for (const order of data) {
                rows.push([order.id, formatUtc(order.created_at), order.status, order.total]);
            }

            if (data.length < EXPORT_BATCH) break;
        }
    }

    // Exports copy customer data out of the dashboard, so they are logged too. The
    // search text may be a customer's name, so only its use is recorded.
    logAudit(admin.id, "export", "order", null, {
        rows: rows.length,
        status: filters.status ?? undefined,
        from: filterInput.from,
        to: filterInput.to,
        search: filterInput.search?.trim() ? "used" : undefined,
    });

    const truncated = rows.length >= EXPORT_MAX_ROWS;
    const date = new Date().toISOString().slice(0, 10);

    return {
        success: true,
        message: truncated ? t("exportedFirst", { count: rows.length }) : t("exported", { count: rows.length }),
        csv: toCsv([t("csvOrder"), t("csvCreatedAt"), t("csvStatus"), t("csvTotal")], rows),
        filename: `orders${filters.status ? `-${filters.status.toLowerCase()}` : ""}-${date}.csv`,
    };
}
