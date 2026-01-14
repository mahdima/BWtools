'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { unstable_cache } from "next/cache";

// Cached version of dashboard stats - refreshes every 60 seconds
export const getDashboardStats = unstable_cache(
  async (period?: string) => {
    let startDate = new Date(0); // Default to beginning of time
    const now = new Date();

    if (period === "last_week") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === "last_month") {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else if (period === "last_3_months") {
      startDate = new Date(now.setMonth(now.getMonth() - 3));
    } else if (period === "last_year") {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    // Base queries
    const productsQuery = supabaseAdmin.from('products').select('*', { count: 'exact', head: true });
    const brandsQuery = supabaseAdmin.from('brands').select('*', { count: 'exact', head: true });
    
    // Order-related queries need date filtering
    let ordersQuery = supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });
    let revenueQuery = supabaseAdmin.from('orders').select('total').neq('status', 'Cancelled');

    if (period && period !== 'all') {
      const isoDate = startDate.toISOString();
      ordersQuery = ordersQuery.gte('created_at', isoDate);
      revenueQuery = revenueQuery.gte('created_at', isoDate);
    }

    const [products, orders, brands, revenueResult] = await Promise.all([
      productsQuery,
      ordersQuery,
      brandsQuery,
      revenueQuery,
    ]);

    const totalRevenue = revenueResult.data?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;

    return {
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalBrands: brands.count || 0,
      totalRevenue,
    };
  },
  ['dashboard-stats'],
  { revalidate: 60 } // Cache for 60 seconds
);

export async function getRecentOrders() {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }

  return data;
}

export async function getLowStockProducts() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .lt('in_stock_vailable', 10)
    .order('in_stock_vailable', { ascending: true })
    .limit(5);

  if (error) {
    console.error("Error fetching low stock products:", error);
    return [];
  }

  return data;
}

export async function getRevenueData(period: string = "last_week") {
  let startDate = new Date(0);
  const now = new Date();

  // Determine filtering similar to getDashboardStats
  if (period === "last_week") {
    startDate = new Date(now.setDate(now.getDate() - 7));
  } else if (period === "last_month") {
    startDate = new Date(now.setMonth(now.getMonth() - 1));
  } else if (period === "last_3_months") {
    startDate = new Date(now.setMonth(now.getMonth() - 3));
  } else if (period === "last_year") {
    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
  }

  let query = supabaseAdmin
    .from("orders")
    .select("created_at, total")
    .neq("status", "Cancelled");

  if (period && period !== "all") {
    query = query.gte("created_at", startDate.toISOString());
  }

  query = query.order("created_at", { ascending: true });

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching revenue data:", error);
    return [];
  }

  // Aggregate in JS
  // Map: DateString -> Total
  const groupedData: Record<string, number> = {};

  data.forEach((order) => {
    const date = new Date(order.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }); // e.g. "Dec 25"
    if (!groupedData[date]) {
      groupedData[date] = 0;
    }
    groupedData[date] += order.total || 0;
  });

  // Convert to array
  return Object.keys(groupedData).map((key) => ({
    name: key,
    total: groupedData[key],
  }));
}

export async function getProducts({
  page = 1,
  limit = 20,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("products")
    .select("*, categories(categorie_name), brands(brand_name)", { count: "exact" })
    .order("product_id", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike("product_name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { data: [], count: 0 };
  }

  const formattedData = (data || []).map((item: any) => ({
    id: item.product_id,
    product: item.product_name,
    category: item.categories?.categorie_name || "",
    price: item.unite_price,
    brand: item.brands?.brand_name || "",
    in_stock_vailable: item.in_stock_vailable,
    // Add other fields if needed for editing (used in form)
    ...item,
  }));

  return { data: formattedData, count: count || 0 };
}

export async function getOrders({
  page = 1,
  limit = 20,
  search = "",
  status = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    // Search by ID or other fields if needed. IDs are usually UUIDs or ints.
    // Assuming search logic needs to be defined. For now, maybe just ID?
    // Or ignore search if not applicable to orders yet. 
    // Let's assume ID search if it's text.
    query = query.textSearch("id", search); 
  }

  if (status && status !== "All") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching orders:", error);
    return { data: [], count: 0 };
  }

  const formattedData = (data || []).map((item: any) => ({
    id: item.id,
    created_at: item.created_at,
    total: item.total,
    status: item.status,
  }));

  return { data: formattedData, count: count || 0 };
}
