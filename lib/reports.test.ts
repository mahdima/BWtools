import { describe, expect, it } from "vitest";
import {
  formatPercentChange,
  groupSales,
  percentChange,
  previousPeriod,
  topWithOther,
  type SalesLine,
} from "@/lib/reports";

const now = new Date("2026-10-22T10:00:00Z");

describe("previousPeriod", () => {
  it("is the window of the same length just before the period", () => {
    expect(previousPeriod("last_week", now)).toEqual({
      start: new Date("2026-10-08T10:00:00Z"),
      end: new Date("2026-10-15T10:00:00Z"),
    });
    expect(previousPeriod("last_month", now)).toEqual({
      start: new Date("2026-08-22T10:00:00Z"),
      end: new Date("2026-09-22T10:00:00Z"),
    });
    expect(previousPeriod("last_year", now)?.start.toISOString()).toBe("2024-10-22T10:00:00.000Z");
  });

  it("has nothing before all time", () => {
    expect(previousPeriod("all", now)).toBeNull();
    expect(previousPeriod(undefined, now)).toBeNull();
  });
});

describe("percentChange / formatPercentChange", () => {
  it("computes the change, or null without a previous value", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(75, 100)).toBe(-25);
    expect(percentChange(10, 0)).toBeNull();
  });

  it("formats with a sign and sensible rounding", () => {
    expect(formatPercentChange(50)).toBe("+50%");
    expect(formatPercentChange(-25.4)).toBe("−25%");
    expect(formatPercentChange(3.26)).toBe("+3.3%");
    expect(formatPercentChange(0.02)).toBe("0%");
  });
});

const line = (
  product_id: number,
  name: string,
  quantity: number,
  unit_price: number,
  category: [number, string] | null,
  brand: [number, string] | null,
): SalesLine => ({
  product_id,
  quantity,
  unit_price,
  products: {
    product_name: name,
    Category_id: category?.[0] ?? null,
    brand_id: brand?.[0] ?? null,
    categories: category ? { categorie_name: category[1] } : null,
    brands: brand ? { brand_name: brand[1] } : null,
  },
});

const lines = [
  line(1, "Drill", 2, 5000, [10, "Power tools"], [7, "Bosch"]),
  line(2, "Saw", 1, 3000, [10, "Power tools"], [8, "Makita"]),
  line(1, "Drill", 1, 4500, [10, "Power tools"], [7, "Bosch"]), // sold again at a lower price
  line(3, "Gloves", 10, 200, null, null),
];

describe("groupSales", () => {
  it("sums units and the price paid per product, best first", () => {
    expect(groupSales(lines, "product")).toEqual([
      { id: 1, label: "Drill", quantity: 3, revenue: 14500 },
      { id: 2, label: "Saw", quantity: 1, revenue: 3000 },
      { id: 3, label: "Gloves", quantity: 10, revenue: 2000 },
    ]);
  });

  it("groups by category and brand, marking missing ones", () => {
    expect(groupSales(lines, "category")).toEqual([
      { id: 10, label: "Power tools", quantity: 4, revenue: 17500 },
      { id: null, label: "", quantity: 10, revenue: 2000, missing: true },
    ]);
    expect(groupSales(lines, "brand").map((row) => row.label)).toEqual(["Bosch", "Makita", ""]);
    expect(groupSales(lines, "brand").at(-1)?.missing).toBe(true);
  });

  it("returns nothing for no lines", () => {
    expect(groupSales([], "brand")).toEqual([]);
  });
});

describe("topWithOther", () => {
  it("folds the tail into one Other row", () => {
    const rows = groupSales(lines, "product");
    expect(topWithOther(rows, 5)).toBe(rows);
    expect(topWithOther(rows, 2)).toEqual([
      { id: 1, label: "Drill", quantity: 3, revenue: 14500 },
      { id: null, label: "", quantity: 11, revenue: 5000, other: 2 },
    ]);
  });
});
