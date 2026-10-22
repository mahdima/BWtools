import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  STORE_TIME_ZONE,
  chooseRevenueBucket,
  fillRevenueBuckets,
  getPeriodStart,
  groupRevenue,
} from "@/lib/dates";
import { queryByArchived } from "@/lib/archive";

// The aggregate functions from docs/sql/P6-06-dashboard-aggregates.sql aren't in the
// generated types until the owner applies them, hence the untyped client for rpc().
const untyped = () => supabaseAdmin as unknown as SupabaseClient;

// PostgREST error when a function doesn't exist (yet): use the fallback path.
export const isMissingFunction = (error: { code?: string } | null) => error?.code === "PGRST202";

// "Revenue" counts orders that are not cancelled; a missing status is not cancelled.
export const NOT_CANCELLED = "status.is.null,status.neq.Cancelled";

// Fallback: every non-cancelled order (created_at, total) from `start` (and before
// `end`), fetched in pages because Supabase returns at most 1000 rows per request.
export async function fetchRevenueRows(start: Date | null, end?: Date) {
  const rows: { created_at: string; total: number }[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabaseAdmin
      .from("orders")
      .select("created_at, total")
      .or(NOT_CANCELLED)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (start) query = query.gte("created_at", start.toISOString());
    if (end) query = query.lt("created_at", end.toISOString());

    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

// Cached version of dashboard stats - refreshes every 60 seconds
export const getDashboardStats = unstable_cache(
  async (period?: string) => {
    const startDate = getPeriodStart(period); // null = all time

    const { data, error } = await untyped().rpc("dashboard_stats", { p_start: startDate?.toISOString() ?? null });
    const row = Array.isArray(data) ? data[0] : null;
    if (!error && row) {
      return {
        totalProducts: Number(row.total_products),
        totalOrders: Number(row.total_orders),
        totalBrands: Number(row.total_brands),
        totalRevenue: Number(row.total_revenue),
      };
    }
    if (error && !isMissingFunction(error)) console.error("dashboard_stats failed, using fallback:", error);

    // Fallback until the SQL function exists: counts, plus revenue summed here
    let ordersQuery = supabaseAdmin.from("orders").select("*", { count: "exact", head: true });
    if (startDate) ordersQuery = ordersQuery.gte("created_at", startDate.toISOString());

    // Archived products and brands aren't counted (not head: true, see queryByArchived)
    const [products, orders, brands, revenueRows] = await Promise.all([
      queryByArchived(false, (archived) => {
        const query = supabaseAdmin.from("products").select("product_id", { count: "exact" }).limit(1);
        return archived === null ? query : query.eq("is_archived", archived);
      }),
      ordersQuery,
      queryByArchived(false, (archived) => {
        const query = supabaseAdmin.from("brands").select("brand_id", { count: "exact" }).limit(1);
        return archived === null ? query : query.eq("is_archived", archived);
      }),
      fetchRevenueRows(startDate).catch((e) => {
        console.error("Error fetching revenue:", e);
        return [];
      }),
    ]);

    return {
      totalProducts: products.result?.count || 0,
      totalOrders: orders.count || 0,
      totalBrands: brands.result?.count || 0,
      totalRevenue: revenueRows.reduce((sum, order) => sum + (order.total || 0), 0),
    };
  },
  ["dashboard-stats"],
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

// The active products closest to running out (stock at or below `threshold`, the
// store's low-stock setting), plus how many there are in total.
export async function getLowStockProducts(threshold: number, limit = 5) {
  const { result } = await queryByArchived(false, (archived) => {
    const query = supabaseAdmin
      .from('products')
      .select('product_id, product_name, in_stock_vailable', { count: 'exact' })
      .lte('in_stock_vailable', threshold)
      .order('in_stock_vailable', { ascending: true })
      .limit(limit);
    return archived === null ? query : query.eq('is_archived', archived);
  });

  if (!result || result.error) {
    if (result?.error) console.error("Error fetching low stock products:", result.error);
    return { products: [], total: 0 };
  }

  return { products: result.data ?? [], total: result.count ?? 0 };
}

// Revenue per day/week/month for the dashboard chart. Uses the revenue_series SQL
// function when it exists, otherwise sums the orders here (see groupRevenue).
export async function getRevenueData(period: string = "last_week") {
  const now = new Date();
  let start = getPeriodStart(period, now);

  // "All time" starts at the first non-cancelled order
  if (!start) {
    const { data: first } = await supabaseAdmin
      .from("orders")
      .select("created_at")
      .or(NOT_CANCELLED)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!first) return [];
    start = new Date(first.created_at);
  }

  const bucket = chooseRevenueBucket(start, now);
  const { data, error } = await untyped().rpc("revenue_series", {
    p_start: start.toISOString(),
    p_bucket: bucket,
    p_time_zone: STORE_TIME_ZONE,
  });

  if (!error && Array.isArray(data)) {
    if (data.length === 0) return [];
    const totals = new Map<string, number>(
      data.map((row: { bucket_start: string; total: number | string }) => [row.bucket_start, Number(row.total)]),
    );
    return fillRevenueBuckets(totals, bucket, start, now);
  }
  if (error && !isMissingFunction(error)) console.error("revenue_series failed, using fallback:", error);

  try {
    return groupRevenue(await fetchRevenueRows(getPeriodStart(period, now)), period, now);
  } catch (e) {
    console.error("Error fetching revenue data:", e);
    return [];
  }
}
