import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { InvoicePrintable } from "@/components/invoice-printable";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;

  // Fetch Order
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    console.error("Order not found or error:", orderError);
    return notFound();
  }

  // Fetch Order Items (Trying 'order_items' table assumption)
  const { data: items, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select("*, products(product_name, unite_price)")
    .eq("order_id", id);

  // If order_items table exists, we map it. If not, we just pass empty array.
  // Assuming a join with products to get details.
  // This is speculative. If it fails, we handle graceful empty items in component.

  const formattedItems = (items || []).map((item: any) => ({
    product_name: item.products?.product_name || "Product",
    quantity: item.quantity || 1,
    price: item.price || item.products?.unite_price || 0,
  }));

  return <InvoicePrintable order={order} items={formattedItems} />;
}
