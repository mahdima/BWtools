import { describe, expect, it } from "vitest";
import { diffChanges, formatChanges, isAuditAction, isAuditEntity, type ChangeLabels } from "@/lib/audit-changes";
import en from "@/messages/en.json";

// The English labels, as the /audit page builds them from messages/en.json
const labels: ChangeLabels = {
  field: (key) => en.audit.fields[key],
  value: (field, value) => (field === "role" && value in en.roles ? en.roles[value as keyof typeof en.roles] : undefined),
  yes: en.audit.yes,
  no: en.audit.no,
  empty: en.audit.empty,
  image: { added: en.audit.imageAdded, removed: en.audit.imageRemoved, replaced: en.audit.imageReplaced },
  line: (field, value) => en.audit.line.replace("{field}", field).replace("{value}", value),
  change: (from, to) => en.audit.change.replace("{from}", from).replace("{to}", to),
};

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
      }, labels),
    ).toEqual(["Price: 1200 → 1500", "Stock: (empty) → 3", "Is active: yes → no"]);
  });

  it("summarises image changes instead of showing URLs", () => {
    expect(
      formatChanges({
        product_link: { from: null, to: "https://x/a.png" },
        cat_image_url: { from: "https://x/a.png", to: null },
      }, labels),
    ).toEqual(["Image: added", "Image: removed"]);
    expect(formatChanges({ product_link: { from: "https://x/a.png", to: "https://x/b.png" } }, labels)).toEqual([
      "Image: replaced",
    ]);
  });

  it("shows new-only values and plain values", () => {
    expect(formatChanges({ status: { to: "Delivered" } }, labels)).toEqual(["Status: Delivered"]);
    expect(formatChanges({ rows: 42, fields: ["username", "phone"] }, labels)).toEqual(["Rows: 42", "Fields: username, phone"]);
    expect(formatChanges(null, labels)).toEqual([]);
  });

  it("translates values when a label for them exists", () => {
    expect(formatChanges({ role: { from: "viewer", to: "super_admin" } }, labels)).toEqual(["Role: Viewer → Super Admin"]);
  });
});

describe("isAuditEntity", () => {
  it("accepts known record types only", () => {
    expect(isAuditEntity("product")).toBe(true);
    expect(isAuditEntity("store_settings")).toBe(true);
    expect(isAuditEntity("profiles")).toBe(false);
    expect(isAuditEntity(undefined)).toBe(false);
  });

  it("knows the logged actions", () => {
    expect(isAuditAction("status_change")).toBe(true);
    expect(isAuditAction("drop")).toBe(false);
  });
});
