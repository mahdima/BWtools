// Order statuses exactly as stored in `orders.status`. Note the lowercase "processing".
export const ORDER_STATUSES = ["New", "processing", "Delivering", "Delivered", "Cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}
