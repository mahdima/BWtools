import { describe, expect, it } from "vitest";
import { diffChanges, formatChanges, isAuditEntity } from "@/lib/audit-changes";

describe("diffChanges", () => {
  it("keeps only the fields that changed", () => {
    expect(
      diffChanges(
        { product_name: "Drill", unite_price: 1200, in_stock_vailable: 4 },
        { product_name: "Drill", unite_price: 1500, in_stock_vailable: 4 },
      ),
    ).toEqual({ unite_price: { from: 1200, to: 1500 } });
  });

  it("treats a missing old value as null and skips undefined new values", () => {
    expect(diffChanges({}, { brand_id: 3, description: undefined })).toEqual({ brand_id: { from: null, to: 3 } });
    expect(diffChanges({ brand_id: null }, { brand_id: null })).toEqual({});
  });

  it("shortens long text", () => {
    const change = diffChanges({ description: "" }, { description: "x".repeat(500) }).description;
    expect(String(change.to)).toHaveLength(121);
    expect(String(change.to).endsWith("…")).toBe(true);
  });
});

describe("formatChanges", () => {
  it("shows changes with readable field names", () => {
    expect(
      formatChanges({
        unite_price: { from: 1200, to: 1500 },
        in_stock_vailable: { from: null, to: 3 },
        is_active: { from: true, to: false },
      }),
    ).toEqual(["Price: 1200 → 1500", "Stock: (empty) → 3", "Is active: yes → no"]);
  });

  it("summarises image changes instead of showing URLs", () => {
    expect(
      formatChanges({
        product_link: { from: null, to: "https://x/a.png" },
        cat_image_url: { from: "https://x/a.png", to: null },
      }),
    ).toEqual(["Image: added", "Image: removed"]);
    expect(formatChanges({ product_link: { from: "https://x/a.png", to: "https://x/b.png" } })).toEqual([
      "Image: replaced",
    ]);
  });

  it("shows new-only values and plain values", () => {
    expect(formatChanges({ status: { to: "Delivered" } })).toEqual(["Status: Delivered"]);
    expect(formatChanges({ rows: 42, fields: ["username", "phone"] })).toEqual(["Rows: 42", "Fields: username, phone"]);
    expect(formatChanges(null)).toEqual([]);
  });
});

describe("isAuditEntity", () => {
  it("accepts known record types only", () => {
    expect(isAuditEntity("product")).toBe(true);
    expect(isAuditEntity("store_settings")).toBe(true);
    expect(isAuditEntity("profiles")).toBe(false);
    expect(isAuditEntity(undefined)).toBe(false);
  });
});
