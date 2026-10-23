// CSV import of products (P7-03): reading the file, matching categories and brands,
// and validating each row with the product form's own rules. Pure, so the preview and
// the import (which re-checks everything on the server) use exactly the same logic.
import { parseCsv } from "@/lib/csv";
import { productSchema } from "@/lib/validation/product";

export const MAX_IMPORT_ROWS = 500;
export const MAX_IMPORT_CHARS = 1_000_000;

export const IMPORT_TEMPLATE_HEADERS = ["name", "price", "quantity", "category", "brand", "description"];

// Accepted column names, compared without case or accents (English and French).
const HEADER_ALIASES = {
  name: ["name", "product", "product name", "product_name", "nom", "produit"],
  price: ["price", "unit price", "prix"],
  quantity: ["quantity", "stock", "qty", "quantite"],
  category: ["category", "categorie"],
  brand: ["brand", "marque"],
  description: ["description"],
} as const;

type Field = keyof typeof HEADER_ALIASES;
const REQUIRED: Field[] = ["name", "price", "category", "brand"];

const importSchema = productSchema.pick({
  product: true,
  category: true,
  brand: true,
  price: true,
  quantity: true,
  description: true,
});

export type ImportLookup = {
  categories: { categorie_id: number; categorie_name: string | null }[];
  brands: { brand_id: number; brand_name: string | null }[];
  // Names already in the catalogue, from normalizeName
  existingNames: Set<string>;
};

// A problem, as a key in messages/*.json "validation" plus its values; the server
// translates it for the admin.
export type ImportMessage = { key: string; values?: Record<string, string | number> };

export type ImportRow = {
  row: number; // position in the file, the header being row 1
  name: string;
  category: string;
  brand: string;
  price: string;
  quantity: string;
  errors: ImportMessage[];
  // The products row to insert, when there are no errors
  values: {
    product_name: string;
    Category_id: number;
    brand_id: number;
    unite_price: number;
    in_stock_vailable: number;
    description: string | undefined;
  } | null;
};

// Lower-case, without accents or surrounding spaces: "Catégorie " -> "categorie".
export function normalizeName(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
}

// "1 200,50", "1200.50" and "1,200.50" -> 1200.5; empty -> undefined; text -> NaN.
export function parseImportNumber(value: string): number | undefined {
  let text = value.replace(/[\s  ]/g, "");
  if (text === "") return undefined;
  text = text.includes(",") && text.includes(".") ? text.replace(/,/g, "") : text.replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Plain text from the file as the editor's HTML: one paragraph per line.
export function descriptionToHtml(text: string): string | undefined {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.length ? lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("") : undefined;
}

// A category or brand by id ("12") or by name, ignoring case and accents.
function resolve<T>(value: string, items: T[], id: (item: T) => number, name: (item: T) => string | null) {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return items.find((item) => id(item) === Number(trimmed));
  const wanted = normalizeName(trimmed);
  return items.find((item) => normalizeName(name(item) ?? "") === wanted);
}

// Reads a products CSV and checks every row. `error` is set when the file as a whole
// can't be used (no rows, missing columns, too many rows).
export function readProductImport(text: string, lookup: ImportLookup): { error?: ImportMessage; rows: ImportRow[] } {
  if (text.length > MAX_IMPORT_CHARS) return { error: { key: "import.tooLarge" }, rows: [] };

  const [header, ...lines] = parseCsv(text);
  if (!header || lines.length === 0) return { error: { key: "import.noProducts" }, rows: [] };

  const columns: Partial<Record<Field, number>> = {};
  header.forEach((title, index) => {
    const name = normalizeName(title);
    const field = (Object.keys(HEADER_ALIASES) as Field[]).find((key) =>
      (HEADER_ALIASES[key] as readonly string[]).includes(name),
    );
    if (field && columns[field] === undefined) columns[field] = index;
  });

  const missing = REQUIRED.filter((field) => columns[field] === undefined);
  if (missing.length) {
    return {
      error: {
        key: "import.missingColumns",
        values: { count: missing.length, columns: missing.join(", "), expected: IMPORT_TEMPLATE_HEADERS.join(", ") },
      },
      rows: [],
    };
  }
  if (lines.length > MAX_IMPORT_ROWS) {
    return { error: { key: "import.tooMany", values: { count: lines.length, max: MAX_IMPORT_ROWS } }, rows: [] };
  }

  const cell = (fields: string[], field: Field) => {
    const index = columns[field];
    return index === undefined ? "" : (fields[index] ?? "").trim();
  };
  const seen = new Set<string>();

  const rows = lines.map((fields, index): ImportRow => {
    const raw = {
      name: cell(fields, "name"),
      category: cell(fields, "category"),
      brand: cell(fields, "brand"),
      price: cell(fields, "price"),
      quantity: cell(fields, "quantity"),
      description: cell(fields, "description"),
    };
    const errors: ImportMessage[] = [];

    const category = raw.category
      ? resolve(raw.category, lookup.categories, (c) => c.categorie_id, (c) => c.categorie_name)
      : undefined;
    if (!raw.category) errors.push({ key: "import.categoryMissing" });
    else if (!category) errors.push({ key: "import.unknownCategory", values: { name: raw.category } });

    const brand = raw.brand ? resolve(raw.brand, lookup.brands, (b) => b.brand_id, (b) => b.brand_name) : undefined;
    if (!raw.brand) errors.push({ key: "import.brandMissing" });
    else if (!brand) errors.push({ key: "import.unknownBrand", values: { name: raw.brand } });

    const parsed = importSchema.safeParse({
      product: raw.name,
      category: category?.categorie_id ?? 1, // reported above when missing or unknown
      brand: brand?.brand_id ?? 1,
      price: parseImportNumber(raw.price),
      quantity: parseImportNumber(raw.quantity) ?? 0,
      description: descriptionToHtml(raw.description),
    });
    if (!parsed.success) errors.push(...parsed.error.issues.map((issue) => ({ key: issue.message })));

    const key = normalizeName(raw.name);
    if (key && lookup.existingNames.has(key)) errors.push({ key: "import.nameExists" });
    else if (key && seen.has(key)) errors.push({ key: "import.nameRepeated" });
    seen.add(key);

    return {
      row: index + 2,
      ...raw,
      category: category?.categorie_name ?? raw.category,
      brand: brand?.brand_name ?? raw.brand,
      errors,
      values:
        errors.length === 0 && parsed.success
          ? {
              product_name: parsed.data.product,
              Category_id: parsed.data.category,
              brand_id: parsed.data.brand,
              unite_price: parsed.data.price,
              in_stock_vailable: parsed.data.quantity,
              description: parsed.data.description,
            }
          : null,
    };
  });

  return { rows };
}
