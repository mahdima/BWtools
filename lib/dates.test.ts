import { describe, expect, it } from "vitest";
import {
  chooseRevenueBucket,
  fillRevenueBuckets,
  getPeriodStart,
  groupRevenue,
  localDateKey,
  localDayStartUtc,
  nextDateKey,
  parseDateKey,
} from "@/lib/dates";

// Wednesday 22 Oct 2026, 10:00 UTC (11:00 in Algiers)
const now = new Date("2026-10-22T10:00:00Z");

describe("getPeriodStart", () => {
  it("goes back by the period length", () => {
    expect(getPeriodStart("last_week", now)?.toISOString()).toBe("2026-10-15T10:00:00.000Z");
    expect(getPeriodStart("last_month", now)?.toISOString()).toBe("2026-09-22T10:00:00.000Z");
    expect(getPeriodStart("last_3_months", now)?.toISOString()).toBe("2026-07-22T10:00:00.000Z");
    expect(getPeriodStart("last_year", now)?.toISOString()).toBe("2025-10-22T10:00:00.000Z");
  });

  it("returns null for all time and unknown values", () => {
    expect(getPeriodStart("all", now)).toBeNull();
    expect(getPeriodStart(undefined, now)).toBeNull();
    expect(getPeriodStart("yesterday", now)).toBeNull();
  });

  it("does not modify `now`", () => {
    const fixed = new Date(now);
    getPeriodStart("last_year", fixed);
    expect(fixed.toISOString()).toBe(now.toISOString());
  });
});

describe("localDateKey", () => {
  it("uses the store's time zone (UTC+1)", () => {
    expect(localDateKey(new Date("2026-10-21T23:30:00Z"))).toBe("2026-10-22");
    expect(localDateKey(new Date("2026-10-21T22:30:00Z"))).toBe("2026-10-21");
  });
});

describe("groupRevenue", () => {
  it("returns nothing when there are no orders", () => {
    expect(groupRevenue([], "last_week", now)).toEqual([]);
    expect(groupRevenue([], "all", now)).toEqual([]);
  });

  it("buckets a week by day, filling quiet days with 0", () => {
    const result = groupRevenue(
      [
        { created_at: "2026-10-16T09:00:00Z", total: 100 },
        { created_at: "2026-10-16T15:00:00Z", total: 50 },
        { created_at: "2026-10-21T23:30:00Z", total: 70 }, // 22 Oct in Algiers
      ],
      "last_week",
      now,
    );
    expect(result).toEqual([
      { name: "Oct 15", total: 0 },
      { name: "Oct 16", total: 150 },
      { name: "Oct 17", total: 0 },
      { name: "Oct 18", total: 0 },
      { name: "Oct 19", total: 0 },
      { name: "Oct 20", total: 0 },
      { name: "Oct 21", total: 0 },
      { name: "Oct 22", total: 70 },
    ]);
  });

  it("buckets three months by week (starting Monday)", () => {
    const result = groupRevenue(
      [
        { created_at: "2026-10-19T08:00:00Z", total: 10 }, // Monday
        { created_at: "2026-10-22T08:00:00Z", total: 5 }, // same week
      ],
      "last_3_months",
      now,
    );
    expect(result.at(-1)).toEqual({ name: "Oct 19", total: 15 });
    expect(result.length).toBe(14);
    expect(result[0].name).toBe("Jul 20");
  });

  it("never merges the same day of different years", () => {
    const result = groupRevenue(
      [
        { created_at: "2025-01-05T12:00:00Z", total: 300 },
        { created_at: "2026-01-05T12:00:00Z", total: 400 },
      ],
      "all",
      now,
    );
    const jan2025 = result.find((r) => r.name === "Jan 2025");
    const jan2026 = result.find((r) => r.name === "Jan 2026");
    expect(jan2025?.total).toBe(300);
    expect(jan2026?.total).toBe(400);
    expect(result[0].name).toBe("Jan 2025");
    expect(result.at(-1)?.name).toBe("Oct 2026");
    expect(result.length).toBe(22);
  });

  it("treats a null total as 0", () => {
    expect(groupRevenue([{ created_at: "2026-10-22T08:00:00Z", total: null }], "last_week", now).at(-1)).toEqual({
      name: "Oct 22",
      total: 0,
    });
  });
});

describe("parseDateKey", () => {
  it("accepts real dates only", () => {
    expect(parseDateKey("2026-10-01")).toBe("2026-10-01");
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(parseDateKey("2026-10-1")).toBeNull();
    expect(parseDateKey("yesterday")).toBeNull();
    expect(parseDateKey(null)).toBeNull();
  });
});

describe("localDayStartUtc / nextDateKey", () => {
  it("starts an Algiers day one hour before UTC midnight", () => {
    expect(localDayStartUtc("2026-10-01")).toBe("2026-09-30T23:00:00.000Z");
  });

  it("handles other zones", () => {
    expect(localDayStartUtc("2026-10-01", "UTC")).toBe("2026-10-01T00:00:00.000Z");
    expect(localDayStartUtc("2026-07-01", "Europe/Paris")).toBe("2026-06-30T22:00:00.000Z");
  });

  it("steps to the next day across month and year ends", () => {
    expect(nextDateKey("2026-10-31")).toBe("2026-11-01");
    expect(nextDateKey("2026-12-31")).toBe("2027-01-01");
  });
});

describe("chooseRevenueBucket", () => {
  it("picks day, week or month from the range length", () => {
    expect(chooseRevenueBucket(getPeriodStart("last_week", now)!, now)).toBe("day");
    expect(chooseRevenueBucket(getPeriodStart("last_month", now)!, now)).toBe("day");
    expect(chooseRevenueBucket(getPeriodStart("last_3_months", now)!, now)).toBe("week");
    expect(chooseRevenueBucket(getPeriodStart("last_year", now)!, now)).toBe("month");
  });
});

describe("fillRevenueBuckets", () => {
  it("fills totals already bucketed by the database, with 0 for gaps", () => {
    // revenue_series returns the first day of each bucket
    const totals = new Map([
      ["2026-10-19", 15], // week of Monday 19 Oct
      ["2026-10-05", 40],
    ]);
    const rows = fillRevenueBuckets(totals, "week", new Date("2026-10-01T00:00:00Z"), now);
    expect(rows).toEqual([
      { name: "Sep 28", total: 0 },
      { name: "Oct 5", total: 40 },
      { name: "Oct 12", total: 0 },
      { name: "Oct 19", total: 15 },
    ]);
  });

  it("matches groupRevenue for the same orders", () => {
    const orders = [
      { created_at: "2026-10-16T09:00:00Z", total: 100 },
      { created_at: "2026-10-21T23:30:00Z", total: 70 },
    ];
    const start = getPeriodStart("last_week", now)!;
    const totals = new Map([
      ["2026-10-16", 100],
      ["2026-10-22", 70],
    ]);
    expect(fillRevenueBuckets(totals, "day", start, now)).toEqual(groupRevenue(orders, "last_week", now));
  });
});
