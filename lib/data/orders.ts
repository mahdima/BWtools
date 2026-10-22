import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ShippingAddress } from "@/lib/address";

export type OrderLine = {
  id: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  // The price paid, stored on the order line (not the product's current price)
  unitPrice: number;
  lineTotal: number;
};

export type OrderCustomer = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type OrderDetails = {
  id: number;
  createdAt: string;
  status: string | null;
  total: number;
  items: OrderLine[];
  // Sum of the lines; differs from `total` when the order has other charges (e.g. delivery)
  itemsTotal: number;
  customer: OrderCustomer | null;
  shippingAddress: ShippingAddress | null;
};

// The customer behind `orders.user_id`: name from `profiles`, email and phone from the
// auth user (phone falls back to the metadata fields the mobile app has used).
async function getOrderCustomer(userId: string): Promise<OrderCustomer | null> {
  const [profileResult, authResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("full_name, username").eq("id", userId).maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(userId),
  ]);

  const profile = profileResult.data;
  const authUser = authResult.data?.user;
  if (!profile && !authUser) {
    console.warn("Could not load customer for order:", authResult.error?.message);
    return null;
  }

  const metadata = authUser?.user_metadata ?? {};
  return {
    name: profile?.full_name || profile?.username || null,
    email: authUser?.email ?? null,
    phone: authUser?.phone || metadata.phone || metadata.phone_number || null,
  };
}

// Everything the order page and the invoice show for one order, or null if it doesn't exist.
export async function getOrderWithDetails(orderId: number): Promise<OrderDetails | null> {
  const [orderResult, itemsResult] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select(
        "id, created_at, status, total, user_id, addresses(full_name, phone_number, street, city, state, zip_code, country)",
      )
      .eq("id", orderId)
      .maybeSingle(),
    supabaseAdmin
      .from("order_items")
      .select("id, quantity, unit_price, products(product_name, product_link)")
      .eq("order_id", orderId)
      .order("id"),
  ]);

  if (orderResult.error) {
    console.error("Error fetching order:", orderResult.error);
  }
  const order = orderResult.data;
  if (!order) return null;

  if (itemsResult.error) {
    console.error("Error fetching order items:", itemsResult.error);
  }
  const items: OrderLine[] = (itemsResult.data ?? []).map((item) => ({
    id: item.id,
    productName: item.products?.product_name ?? "Deleted product",
    productImage: item.products?.product_link ?? null,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    lineTotal: item.quantity * item.unit_price,
  }));

  const address = order.addresses;

  return {
    id: order.id,
    createdAt: order.created_at,
    status: order.status,
    total: order.total,
    items,
    itemsTotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    customer: order.user_id ? await getOrderCustomer(order.user_id) : null,
    shippingAddress: address
      ? {
          fullName: address.full_name,
          phone: address.phone_number,
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zip_code,
          country: address.country,
        }
      : null,
  };
}
