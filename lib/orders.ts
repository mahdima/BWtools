// Order statuses exactly as stored in `orders.status`. Note the lowercase "processing".
export const ORDER_STATUSES = ["New", "processing", "Delivering", "Delivered", "Cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

// The order number typed in the search box ("123", "#123"), or null if it isn't one.
export function parseOrderNumber(input: string): number | null {
  const digits = input.trim().replace(/^#/, "");
  if (!/^\d+$/.test(digits)) return null;

  const id = Number(digits);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
