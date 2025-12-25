'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, newStatus: string) {
    if (!orderId || !newStatus) {
        throw new Error("Order ID and status are required");
    }

    const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        console.error("Error updating order status:", error);
        throw new Error(`Failed to update status: ${error.message}`);
    }

    revalidatePath("/order");
    revalidatePath(`/order/${orderId}`);
}
