import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPeriodStart, groupRevenue } from "@/lib/dates";

// Cached version of dashboard stats - refreshes every 60 seconds
export const getDashboardStats = unstable_cache(
  async (period?: string) => {
    const startDate = getPeriodStart(period); // null = all time

    // Base queries
    const productsQuery = supabaseAdmin.from('products').select('*', { count: 'exact', head: true });
    const brandsQuery = supabaseAdmin.from('brands').select('*', { count: 'exact', head: true });
    
    // Order-related queries need date filtering
    let ordersQuery = supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });
    let revenueQuery = supabaseAdmin.from('orders').select('total').neq('status', 'Cancelled');

    if (startDate) {
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

// The products closest to running out (stock at or below `threshold`, the store's
// low-stock setting), plus how many there are in total.
export async function getLowStockProducts(threshold: number, limit = 5) {
  const { data, error, count } = await supabaseAdmin
    .from('products')
    .select('product_id, product_name, in_stock_vailable', { count: 'exact' })
    .lte('in_stock_vailable', threshold)
    .order('in_stock_vailable', { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching low stock products:", error);
    return { products: [], total: 0 };
  }

  return { products: data ?? [], total: count ?? 0 };
}

// Revenue per day/week/month for the dashboard chart (see groupRevenue in lib/dates.ts).
// NOTE: like getDashboardStats, this reads raw order rows, and Supabase returns at most
// 1000 rows per request; P6-06 moves both to SQL aggregates.
export async function getRevenueData(period: string = "last_week") {
  const now = new Date();
  const startDate = getPeriodStart(period, now);

  let query = supabaseAdmin
    .from("orders")
    .select("created_at, total")
    .neq("status", "Cancelled");

  if (startDate) {
    query = query.gte("created_at", startDate.toISOString());
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error || !data) {
    console.error("Error fetching revenue data:", error);
    return [];
  }

  return groupRevenue(data, period, now);
}
