import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { customerSearchPattern } from "@/lib/orders";
import type { ShippingAddress } from "@/lib/address";

// One page of customers (mobile-app users) with their auth email and phone,
// optionally filtered by username, email or phone.
export async function getCustomers({
  page = 1,
  limit = 20,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const from = (page - 1) * limit;
  const pattern = search.trim() ? customerSearchPattern(search) : null;
  if (search.trim() && !pattern) return { data: [], count: 0 };

  let query = supabaseAdmin
    .from("profiles_with_email")
    .select("*", { count: "exact" })
    .order("username", { ascending: true, nullsFirst: false })
    .range(from, from + limit - 1);

  if (pattern) {
    query = query.or(`username.ilike."${pattern}",email.ilike."${pattern}",phone.ilike."${pattern}"`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching customers:", error);
    return { data: [], count: 0 };
  }

  // The view's columns are all nullable; a row without an id can't be opened, so skip it
  const rows = (data || []).flatMap((item) =>
    item.id ? [{ id: item.id, username: item.username, email: item.email, phone: item.phone }] : [],
  );
  return { data: rows, count: count ?? 0 };
}

export type CustomerDetails = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  orders: { id: number; createdAt: string; status: string | null; total: number }[];
  orderCount: number;
  // Sum of the customer's orders, excluding cancelled ones
  totalSpent: number;
  lastOrderAt: string | null;
  addresses: (ShippingAddress & { id: number; isDefault: boolean })[];
};

// Everything the customer page shows, or null if there is no such customer.
export async function getCustomerDetails(customerId: string): Promise<CustomerDetails | null> {
  const [viewResult, profileResult, ordersResult, addressesResult] = await Promise.all([
    supabaseAdmin.from("profiles_with_email").select("*").eq("id", customerId).maybeSingle(),
    supabaseAdmin.from("profiles").select("full_name").eq("id", customerId).maybeSingle(),
    supabaseAdmin
      .from("orders")
      .select("id, created_at, status, total")
      .eq("user_id", customerId)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("user_id", customerId)
      .order("is_default", { ascending: false, nullsFirst: false }),
  ]);

  for (const result of [viewResult, profileResult, ordersResult, addressesResult]) {
    if (result.error) console.error("Error loading customer details:", result.error);
  }

  const customer = viewResult.data;
  if (!customer?.id) return null;

  const orders = (ordersResult.data ?? []).map((order) => ({
    id: order.id,
    createdAt: order.created_at,
    status: order.status,
    total: order.total,
  }));

  return {
    id: customer.id,
    name: profileResult.data?.full_name ?? null,
    username: customer.username,
    email: customer.email,
    phone: customer.phone,
    orders,
    orderCount: orders.length,
    totalSpent: orders.filter((o) => o.status !== "Cancelled").reduce((sum, o) => sum + o.total, 0),
    lastOrderAt: orders[0]?.createdAt ?? null,
    addresses: (addressesResult.data ?? []).map((address) => ({
      id: address.id,
      isDefault: address.is_default === true,
      fullName: address.full_name,
      phone: address.phone_number,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zip_code,
      country: address.country,
    })),
  };
}
