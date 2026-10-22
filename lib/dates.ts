// Dashboard periods and revenue bucketing. Pure functions: pass `now` in tests.

// The store's time zone: an order at 00:30 in Algiers belongs to that local day,
// even though the server runs in UTC.
export const STORE_TIME_ZONE = "Africa/Algiers";

const DAY_MS = 24 * 60 * 60 * 1000;

// Start of a dashboard period (see components/dashboard-filter.tsx), or null for
// "all" and unknown values.
export function getPeriodStart(period: string | undefined, now: Date = new Date()): Date | null {
  const start = new Date(now);
  switch (period) {
    case "last_week":
      start.setUTCDate(start.getUTCDate() - 7);
      return start;
    case "last_month":
      start.setUTCMonth(start.getUTCMonth() - 1);
      return start;
    case "last_3_months":
      start.setUTCMonth(start.getUTCMonth() - 3);
      return start;
    case "last_year":
      start.setUTCFullYear(start.getUTCFullYear() - 1);
      return start;
    default:
      return null;
  }
}

// "YYYY-MM-DD" of an instant, in the given time zone.
export function localDateKey(date: Date, timeZone: string = STORE_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

type Bucket = "day" | "week" | "month";

// Date keys are plain calendar dates, so do their arithmetic in UTC.
const keyToDate = (key: string) => new Date(`${key}T00:00:00Z`);
const dateToKey = (date: Date) => date.toISOString().slice(0, 10);

// The key of the day/week (Monday)/month that contains `key`.
function bucketKey(key: string, bucket: Bucket): string {
  if (bucket === "day") return key;
  if (bucket === "month") return `${key.slice(0, 7)}-01`;
  const date = keyToDate(key);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return dateToKey(new Date(date.getTime() - daysSinceMonday * DAY_MS));
}

function nextBucketKey(key: string, bucket: Bucket): string {
  const date = keyToDate(key);
  if (bucket === "month") date.setUTCMonth(date.getUTCMonth() + 1);
  else date.setUTCDate(date.getUTCDate() + (bucket === "week" ? 7 : 1));
  return dateToKey(date);
}

function bucketLabel(key: string, bucket: Bucket): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    ...(bucket === "month" ? { year: "numeric" } : { day: "numeric" }),
  }).format(keyToDate(key));
}

// Total revenue per day (ranges up to 31 days), per week (up to 120 days) or per
// month, keyed by full date so the same day in different years never merges.
// Every bucket from the period start to `now` is present, with 0 when it had no
// orders. With no orders at all, returns [] so the chart shows its empty state.
export function groupRevenue(
  orders: { created_at: string; total: number | null }[],
  period: string | undefined,
  now: Date = new Date(),
): { name: string; total: number }[] {
  if (orders.length === 0) return [];

  const start =
    getPeriodStart(period, now) ?? new Date(Math.min(...orders.map((order) => Date.parse(order.created_at))));
  const spanDays = (now.getTime() - start.getTime()) / DAY_MS;
  const bucket: Bucket = spanDays <= 31 ? "day" : spanDays <= 120 ? "week" : "month";

  const totals = new Map<string, number>();
  for (const order of orders) {
    const key = bucketKey(localDateKey(new Date(order.created_at)), bucket);
    totals.set(key, (totals.get(key) ?? 0) + (order.total ?? 0));
  }

  const result: { name: string; total: number }[] = [];
  const last = bucketKey(localDateKey(now), bucket);
  // Keys are YYYY-MM-DD, so string order is date order; the cap guards against bad data
  for (
    let key = bucketKey(localDateKey(start), bucket);
    key <= last && result.length < 1000;
    key = nextBucketKey(key, bucket)
  ) {
    result.push({ name: bucketLabel(key, bucket), total: totals.get(key) ?? 0 });
  }
  return result;
}
