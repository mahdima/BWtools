// Reports (P7-02): comparing a period with the one before it, and grouping sales.
// Pure functions: pass `now` in tests.
import { getPeriodStart } from "@/lib/dates";

// The window just before a dashboard period, of the same length: the week before
// "last_week", the month before "last_month", and so on. Null for "all".
export function previousPeriod(period: string | undefined, now: Date = new Date()): { start: Date; end: Date } | null {
  const end = getPeriodStart(period, now);
  const start = end && getPeriodStart(period, end);
  return start && end ? { start, end } : null;
}

// Words for the stat cards, e.g. "vs previous 7 days".
export const COMPARISON_LABELS: Record<string, string> = {
  last_week: "vs previous 7 days",
  last_month: "vs previous month",
  last_3_months: "vs previous 3 months",
  last_year: "vs previous year",
};

// Change from `previous` to `current` in percent, or null when there's nothing to
// compare with (a previous value of 0).
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

// "+12%", "−4%", "0%" (one decimal under 10%, so small changes don't round to 0).
export function formatPercentChange(change: number): string {
  const rounded = Math.abs(change) < 10 ? Math.round(change * 10) / 10 : Math.round(change);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)}%`;
}

export type SalesGroup = "product" | "category" | "brand";

export type SalesRow = { id: number | null; label: string; quantity: number; revenue: number };

// One order line as the fallback query returns it (see lib/data/reports.ts).
export type SalesLine = {
  product_id: number | null;
  quantity: number | null;
  unit_price: number | null;
  products: {
    product_name: string | null;
    Category_id: number | null;
    brand_id: number | null;
    categories: { categorie_name: string | null } | null;
    brands: { brand_name: string | null } | null;
  } | null;
};

// Label for a line whose product, category or brand is missing.
export const MISSING_LABELS: Record<SalesGroup, string> = {
  product: "Unknown product",
  category: "No category",
  brand: "No brand",
};

// Units sold and sales (quantity × price paid) per product, category or brand, best
// selling first. Same result as the sales_by SQL function.
export function groupSales(lines: SalesLine[], group: SalesGroup): SalesRow[] {
  const rows = new Map<string, SalesRow>();

  for (const line of lines) {
    const product = line.products;
    const id =
      group === "product" ? line.product_id : group === "category" ? (product?.Category_id ?? null) : (product?.brand_id ?? null);
    const label =
      (group === "product"
        ? product?.product_name
        : group === "category"
          ? product?.categories?.categorie_name
          : product?.brands?.brand_name) ?? null;

    const key = `${id}`;
    const row = rows.get(key) ?? { id, label: label || MISSING_LABELS[group], quantity: 0, revenue: 0 };
    const quantity = line.quantity ?? 0;
    row.quantity += quantity;
    row.revenue += quantity * (line.unit_price ?? 0);
    rows.set(key, row);
  }

  return sortSales([...rows.values()]);
}

// Highest sales first; ties by units, then by name.
export function sortSales(rows: SalesRow[]): SalesRow[] {
  return rows.sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity || a.label.localeCompare(b.label));
}

// The first `limit` rows, with the rest summed into one "Other" row.
export function topWithOther(rows: SalesRow[], limit: number): SalesRow[] {
  if (rows.length <= limit) return rows;
  const rest = rows.slice(limit - 1);
  return [
    ...rows.slice(0, limit - 1),
    {
      id: null,
      label: `Other (${rest.length})`,
      quantity: rest.reduce((sum, row) => sum + row.quantity, 0),
      revenue: rest.reduce((sum, row) => sum + row.revenue, 0),
    },
  ];
}
