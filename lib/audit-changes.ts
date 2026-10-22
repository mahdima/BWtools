// Audit log entries (P7-01): what changed, stored small and shown as readable lines.
// Pure, so it can be unit-tested and used by both the actions and the /audit page.

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "archive"
  | "restore"
  | "status_change"
  | "note"
  | "export"
  | "role_change"
  | "deactivate"
  | "reactivate"
  | "password_change";

export type AuditEntity = "product" | "brand" | "category" | "order" | "customer" | "admin" | "store_settings";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  archive: "Archived",
  restore: "Restored",
  status_change: "Changed status",
  note: "Added a note",
  export: "Exported",
  role_change: "Changed role",
  deactivate: "Deactivated",
  reactivate: "Reactivated",
  password_change: "Changed password",
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntity, string> = {
  product: "Product",
  brand: "Brand",
  category: "Category",
  order: "Order",
  customer: "Customer",
  admin: "Admin",
  store_settings: "Store settings",
};

export const isAuditEntity = (value: unknown): value is AuditEntity =>
  typeof value === "string" && value in AUDIT_ENTITY_LABELS;

export type FieldChange = { from: unknown; to: unknown };

const MAX_TEXT = 120;

// Long text (a product description, an order note) is stored shortened.
export function shorten(value: unknown): unknown {
  return typeof value === "string" && value.length > MAX_TEXT ? `${value.slice(0, MAX_TEXT)}…` : value;
}

// The fields of `after` whose value differs from `before`, as { field: { from, to } }.
// Undefined fields in `after` are skipped; missing ones in `before` count as null.
export function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, FieldChange> {
  const changes: Record<string, FieldChange> = {};
  for (const [field, value] of Object.entries(after)) {
    if (value === undefined) continue;
    const old = before[field] ?? null;
    if (JSON.stringify(old) !== JSON.stringify(value)) {
      changes[field] = { from: shorten(old), to: shorten(value) };
    }
  }
  return changes;
}

// Column names as people know them (several columns are misspelled, see CLAUDE.md).
const FIELD_LABELS: Record<string, string> = {
  product_name: "Name",
  categorie_name: "Name",
  brand_name: "Name",
  full_name: "Name",
  unite_price: "Price",
  in_stock_vailable: "Stock",
  Category_id: "Category",
  brand_id: "Brand",
  description: "Description",
  product_link: "Image",
  cat_image_url: "Image",
  low_stock_threshold: "Low-stock threshold",
  invoice_footer: "Invoice footer",
};

const IMAGE_FIELDS = new Set(["product_link", "cat_image_url"]);

const fieldLabel = (field: string) => {
  const label = FIELD_LABELS[field] ?? field.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const isFieldChange = (value: unknown): value is FieldChange =>
  typeof value === "object" && value !== null && "to" in value;

// One readable line per change, e.g. "Price: 1200 → 1500" or "Image: replaced".
export function formatChanges(changes: Record<string, unknown> | null | undefined): string[] {
  if (!changes) return [];

  return Object.entries(changes).map(([field, change]) => {
    const label = fieldLabel(field);
    if (!isFieldChange(change)) return `${label}: ${formatValue(change)}`;

    if (IMAGE_FIELDS.has(field)) {
      const state = !change.from ? "added" : !change.to ? "removed" : "replaced";
      return `${label}: ${state}`;
    }
    return "from" in change && change.from !== undefined
      ? `${label}: ${formatValue(change.from)} → ${formatValue(change.to)}`
      : `${label}: ${formatValue(change.to)}`;
  });
}
