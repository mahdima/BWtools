import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NOT_CANCELLED, fetchRevenueRows, isMissingFunction } from "@/lib/data/dashboard";
import { getPeriodStart } from "@/lib/dates";
import {
  MISSING_LABELS,
  groupSales,
  previousPeriod,
  sortSales,
  type SalesGroup,
  type SalesLine,
  type SalesRow,
} from "@/lib/reports";

// period_totals and sales_by (docs/sql/P7-02-reports.sql) aren't in the generated
// types until the owner applies them, hence the untyped client for rpc().
const untyped = () => supabaseAdmin as unknown as SupabaseClient;

// Orders and revenue in the window before `period` (for the stat cards' change), or
// null for "all time" or when it can't be loaded.
export async function getPreviousPeriodTotals(period: string, now: Date = new Date()) {
  const window = previousPeriod(period, now);
  if (!window) return null;

  const { data, error } = await untyped().rpc("period_totals", {
    p_start: window.start.toISOString(),
    p_end: window.end.toISOString(),
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (!error && row) return { orders: Number(row.total_orders), revenue: Number(row.total_revenue) };
  if (error && !isMissingFunction(error)) console.error("period_totals failed, using fallback:", error);

  // Fallback until the SQL function exists
  try {
    const [orders, revenueRows] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", window.start.toISOString())
        .lt("created_at", window.end.toISOString()),
      fetchRevenueRows(window.start, window.end),
    ]);
    if (orders.error) throw orders.error;
    return { orders: orders.count ?? 0, revenue: revenueRows.reduce((sum, order) => sum + (order.total || 0), 0) };
  } catch (error) {
    console.error("Error loading the previous period:", error);
    return null;
  }
}

// Fallback: every order line of a non-cancelled order since `start`, with its product,
// category and brand names, fetched in pages of 1000.
async function fetchSalesLines(start: Date | null): Promise<SalesLine[]> {
  const lines: SalesLine[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabaseAdmin
      .from("order_items")
      .select(
        "product_id, quantity, unit_price, orders!inner(created_at, status), products(product_name, Category_id, brand_id, categories(categorie_name), brands(brand_name))",
      )
      .or(NOT_CANCELLED, { referencedTable: "orders" })
      .order("id")
      .range(from, from + 999);
    if (start) query = query.gte("orders.created_at", start.toISOString());

    const { data, error } = await query;
    if (error) throw error;
    lines.push(...(data ?? []));
    if (!data || data.length < 1000) return lines;
  }
}

const GROUPS: SalesGroup[] = ["product", "category", "brand"];

// Units sold and sales per product, category and brand for a dashboard period, best
// first. Uses the sales_by SQL function when it exists, otherwise sums order lines here.
export async function getSalesReport(period: string, now: Date = new Date()): Promise<Record<SalesGroup, SalesRow[]>> {
  const start = getPeriodStart(period, now);

  const results = await Promise.all(
    GROUPS.map((group) =>
      untyped().rpc("sales_by", { p_group: group, p_start: start?.toISOString() ?? null, p_end: null }),
    ),
  );

  if (results.every((result) => !result.error && Array.isArray(result.data))) {
    const [product, category, brand] = results.map((result, index) =>
      sortSales(
        (result.data as { group_id: number | null; label: string | null; quantity: number; revenue: number }[]).map(
          (row) => ({
            id: row.group_id === null ? null : Number(row.group_id),
            label: row.label ?? MISSING_LABELS[GROUPS[index]],
            quantity: Number(row.quantity),
            revenue: Number(row.revenue),
          }),
        ),
      ),
    );
    return { product, category, brand };
  }

  const failed = results.find((result) => result.error && !isMissingFunction(result.error));
  if (failed) console.error("sales_by failed, using fallback:", failed.error);

  try {
    const lines = await fetchSalesLines(start);
    return {
      product: groupSales(lines, "product"),
      category: groupSales(lines, "category"),
      brand: groupSales(lines, "brand"),
    };
  } catch (error) {
    console.error("Error loading sales:", error);
    return { product: [], category: [], brand: [] };
  }
}
