import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ShippingAddress } from "@/lib/address";
import { customerSearchPattern, isOrderStatus, parseOrderNumber, type OrderStatus } from "@/lib/orders";
import { localDayStartUtc, nextDateKey, parseDateKey } from "@/lib/dates";

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

export type OrderFilterInput = {
  search?: string; // order number, or customer name / email / phone
  status?: string;
  from?: string; // YYYY-MM-DD, inclusive (store time zone)
  to?: string; // YYYY-MM-DD, inclusive
};

export type OrderFilters = {
  // PostgREST `or` clause for the search, e.g. "id.eq.12,user_id.in.(uuid,...)"
  searchClause: string | null;
  status: OrderStatus | null;
  createdFrom: string | null; // ISO instant for .gte()
  createdBefore: string | null; // ISO instant for .lt()
  // The search can't match anything, so there is no need to query
  matchesNothing: boolean;
};

// Customers whose username, email or phone contains the search text (capped, for
// an IN filter on orders.user_id).
async function findCustomerIds(search: string): Promise<string[]> {
  const pattern = customerSearchPattern(search);
  if (!pattern) return [];

  const { data, error } = await supabaseAdmin
    .from("profiles_with_email")
    .select("id")
    .or(`username.ilike."${pattern}",email.ilike."${pattern}",phone.ilike."${pattern}"`)
    .limit(200);

  if (error) {
    console.error("Error searching customers:", error);
    return [];
  }
  return (data ?? []).flatMap((row) => (row.id ? [row.id] : []));
}

// Turns the order list's URL filters into query clauses, shared by the list and the
// CSV export so both always agree. A number matches the order number or a phone.
export async function resolveOrderFilters({ search = "", status = "", from, to }: OrderFilterInput): Promise<OrderFilters> {
  const term = search.trim();
  let searchClause: string | null = null;
  let matchesNothing = false;

  if (term) {
    const orderId = parseOrderNumber(term);
    const customerIds = await findCustomerIds(term);
    const clauses = [
      ...(orderId !== null ? [`id.eq.${orderId}`] : []),
      ...(customerIds.length ? [`user_id.in.(${customerIds.join(",")})`] : []),
    ];
    if (clauses.length) searchClause = clauses.join(",");
    else matchesNothing = true;
  }

  const fromKey = parseDateKey(from);
  const toKey = parseDateKey(to);

  return {
    searchClause,
    status: isOrderStatus(status) ? status : null,
    createdFrom: fromKey ? localDayStartUtc(fromKey) : null,
    createdBefore: toKey ? localDayStartUtc(nextDateKey(toKey)) : null,
    matchesNothing,
  };
}

// One page of the orders table, newest first, with the list's filters.
export async function getOrders({
  page = 1,
  limit = 20,
  ...filterInput
}: OrderFilterInput & { page?: number; limit?: number }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const filters = await resolveOrderFilters(filterInput);
  if (filters.matchesNothing) {
    return { data: [], count: 0 };
  }

  let query = supabaseAdmin
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.searchClause) query = query.or(filters.searchClause);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.createdFrom) query = query.gte("created_at", filters.createdFrom);
  if (filters.createdBefore) query = query.lt("created_at", filters.createdBefore);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching orders:", error);
    return { data: [], count: 0 };
  }

  const formattedData = (data || []).map((item) => ({
    id: item.id,
    created_at: item.created_at,
    total: item.total,
    status: item.status,
  }));

  return { data: formattedData, count: count || 0 };
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
