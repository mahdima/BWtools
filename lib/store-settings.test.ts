import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_SETTINGS, isMissingTableError, storeSettingsSchema } from "@/lib/store-settings";
import { parseForm } from "@/lib/validation/form";
import en from "@/messages/en.json";

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
};

describe("storeSettingsSchema", () => {
  it("accepts the defaults", () => {
    expect(storeSettingsSchema.parse(DEFAULT_STORE_SETTINGS)).toEqual(DEFAULT_STORE_SETTINGS);
  });

  it("coerces the threshold and turns an empty phone into null", () => {
    const result = parseForm(
      storeSettingsSchema,
      form({ store_name: " BW Tools ", contact_email: "a@b.dz", contact_phone: "", address: "Alger", low_stock_threshold: "5", invoice_footer: "Merci" }),
    );
    expect(result).toEqual({
      success: true,
      data: { store_name: "BW Tools", contact_email: "a@b.dz", contact_phone: null, address: "Alger", low_stock_threshold: 5, invoice_footer: "Merci" },
    });
  });

  it("rejects bad input with readable messages", () => {
    const base = { store_name: "BW", contact_email: "a@b.dz", address: "", invoice_footer: "" };
    const err = (fields: Record<string, string>) => {
      const r = parseForm(storeSettingsSchema, form({ ...base, low_stock_threshold: "10", ...fields }));
      return r.success ? "" : en.validation[r.message as keyof typeof en.validation];
    };
    expect(err({ store_name: "  " })).toBe("Store name is required.");
    expect(err({ contact_email: "nope" })).toBe("Enter a valid contact email.");
    expect(err({ low_stock_threshold: "-1" })).toBe("Low-stock threshold cannot be negative.");
    expect(err({ low_stock_threshold: "2.5" })).toBe("Low-stock threshold must be a whole number.");
  });
});

describe("isMissingTableError", () => {
  it("recognises PostgREST and Postgres missing-table codes", () => {
    expect(isMissingTableError({ code: "PGRST205" })).toBe(true);
    expect(isMissingTableError({ code: "42P01" })).toBe(true);
    expect(isMissingTableError({ code: "23503" })).toBe(false);
    expect(isMissingTableError(null)).toBe(false);
  });
});
