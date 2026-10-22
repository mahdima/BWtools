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
  | "import"
  | "role_change"
  | "deactivate"
  | "reactivate"
  | "password_change";

export type AuditEntity = "product" | "brand" | "category" | "order" | "customer" | "admin" | "store_settings";

export const AUDIT_ACTIONS: AuditAction[] = [
  "create",
  "update",
  "delete",
  "archive",
  "restore",
  "status_change",
  "note",
  "export",
  "import",
  "role_change",
  "deactivate",
  "reactivate",
  "password_change",
];

export const isAuditAction = (value: unknown): value is AuditAction =>
  typeof value === "string" && (AUDIT_ACTIONS as string[]).includes(value);

export const AUDIT_ENTITIES: AuditEntity[] = [
  "product",
  "brand",
  "category",
  "order",
  "customer",
  "admin",
  "store_settings",
];

export const isAuditEntity = (value: unknown): value is AuditEntity =>
  typeof value === "string" && (AUDIT_ENTITIES as string[]).includes(value);

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

// Logged field -> its label key ("audit.fields.*" in messages/*.json). Several
// columns are misspelled (see CLAUDE.md), and several mean "name".
export const FIELD_KEYS = {
  product_name: "name",
  categorie_name: "name",
  brand_name: "name",
  full_name: "name",
  unite_price: "price",
  in_stock_vailable: "stock",
  Category_id: "category",
  brand_id: "brand",
  description: "description",
  product_link: "image",
  cat_image_url: "image",
  low_stock_threshold: "lowStockThreshold",
  invoice_footer: "invoiceFooter",
  store_name: "storeName",
  contact_email: "contactEmail",
  contact_phone: "contactPhone",
  address: "address",
  status: "status",
  role: "role",
  note: "note",
  rows: "rows",
  skipped: "skipped",
  search: "search",
  from: "from",
  to: "to",
  fields: "fields",
  email: "email",
} as const;

export type FieldKey = (typeof FIELD_KEYS)[keyof typeof FIELD_KEYS];

// The words formatChanges needs, in the admin's language.
export type ChangeLabels = {
  field: (key: FieldKey) => string;
  // A translated value, e.g. a role or order status name; undefined keeps it as is
  value?: (field: string, value: string) => string | undefined;
  yes: string;
  no: string;
  empty: string;
  image: { added: string; removed: string; replaced: string };
  // "Price: 1200", and "1200 → 1500" (the arrow points the other way in Arabic)
  line: (field: string, value: string) => string;
  change: (from: string, to: string) => string;
};

const IMAGE_FIELDS = new Set(["product_link", "cat_image_url"]);

function fieldLabel(field: string, labels: ChangeLabels): string {
  const key = (FIELD_KEYS as Record<string, FieldKey>)[field];
  const label = key ? labels.field(key) : field.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatValue(value: unknown, field: string, labels: ChangeLabels): string {
  if (value === null || value === undefined || value === "") return labels.empty;
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (Array.isArray(value)) return value.map((item) => formatValue(item, field, labels)).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return labels.value?.(field, String(value)) ?? String(value);
}

const isFieldChange = (value: unknown): value is FieldChange =>
  typeof value === "object" && value !== null && "to" in value;

// One readable line per change, e.g. "Price: 1200 → 1500" or "Image: replaced".
export function formatChanges(changes: Record<string, unknown> | null | undefined, labels: ChangeLabels): string[] {
  if (!changes) return [];

  return Object.entries(changes).map(([field, change]) => {
    const label = fieldLabel(field, labels);
    if (!isFieldChange(change)) return labels.line(label, formatValue(change, field, labels));

    if (IMAGE_FIELDS.has(field)) {
      const state = !change.from ? "added" : !change.to ? "removed" : "replaced";
      return labels.line(label, labels.image[state]);
    }
    return labels.line(
      label,
      "from" in change && change.from !== undefined
        ? labels.change(formatValue(change.from, field, labels), formatValue(change.to, field, labels))
        : formatValue(change.to, field, labels),
    );
  });
}
