import { z } from "zod";

// Store-wide settings (single row in `store_settings`, see docs/sql/P6-01-store-settings.sql).
export const storeSettingsSchema = z.object({
  store_name: z.string().trim().min(1, "Store name is required.").max(100, "Store name is too long."),
  contact_email: z.email("Enter a valid contact email."),
  contact_phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long.")
    .nullish()
    .transform((value) => value || null),
  address: z.string().trim().max(300, "Address is too long."),
  low_stock_threshold: z.coerce
    .number({ error: "Low-stock threshold must be a number." })
    .int("Low-stock threshold must be a whole number.")
    .min(0, "Low-stock threshold cannot be negative.")
    .max(100_000, "Low-stock threshold is too large."),
  invoice_footer: z.string().trim().max(500, "Invoice footer is too long."),
});

export type StoreSettings = z.output<typeof storeSettingsSchema>;

// Used until the table exists, and as the column defaults in the SQL.
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: "BW Tools",
  contact_email: "contact@bwtools.com",
  contact_phone: null,
  address: "Algeria",
  low_stock_threshold: 10,
  invoice_footer: "Thank you for your business!",
};

// PostgREST / Postgres errors meaning "the table doesn't exist (yet)".
export function isMissingTableError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}
