'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getDashboardStats(period?: string) {
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
}

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
