import { describe, expect, it } from "vitest";
import { ORDER_STATUSES, customerSearchPattern, isOrderStatus, parseOrderNumber } from "@/lib/orders";

describe("ORDER_STATUSES", () => {
  it("matches the values stored in orders.status, including lowercase 'processing'", () => {
    expect(ORDER_STATUSES).toEqual(["New", "processing", "Delivering", "Delivered", "Cancelled"]);
  });
});

describe("isOrderStatus", () => {
  it.each(ORDER_STATUSES)("accepts %s", (status) => {
    expect(isOrderStatus(status)).toBe(true);
  });

  it.each(["Processing", "new", "Shipped", "All", "", "Cancelled "])("rejects %j", (value) => {
    expect(isOrderStatus(value)).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isOrderStatus(null)).toBe(false);
    expect(isOrderStatus(undefined)).toBe(false);
    expect(isOrderStatus(0)).toBe(false);
  });
});

describe("parseOrderNumber", () => {
  it.each([
    ["123", 123],
    ["#123", 123],
    ["  42 ", 42],
    ["#7", 7],
  ])("reads %j as %i", (input, expected) => {
    expect(parseOrderNumber(input)).toBe(expected);
  });

  it.each(["", "   ", "#", "abc", "12a", "1.5", "-3", "0", "1e3", "##12", "99999999999999999999"])(
    "rejects %j",
    (input) => {
      expect(parseOrderNumber(input)).toBeNull();
    },
  );
});

describe("customerSearchPattern", () => {
  it("wraps the term for ilike", () => {
    expect(customerSearchPattern("amina")).toBe("%amina%");
    expect(customerSearchPattern("  +213 555 ")).toBe("%+213 555%");
  });

  it("drops characters that would break the PostgREST filter", () => {
    expect(customerSearchPattern('a,b(c)"d\\e')).toBe("%a b c d e%");
  });

  it("escapes LIKE wildcards", () => {
    expect(customerSearchPattern("50%_off")).toBe("%50\\%\\_off%");
  });

  it("needs at least 2 characters", () => {
    expect(customerSearchPattern("a")).toBeNull();
    expect(customerSearchPattern(" , ")).toBeNull();
  });
});
