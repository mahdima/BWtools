import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { queryByArchived } from "@/lib/archive";

// One page of the products table, newest first, optionally filtered by name. Active
// products by default, or the archived ones. `archiving` is false until the
// is_archived column exists (see lib/archive.ts).
export async function getProducts({
  page = 1,
  limit = 20,
  search = "",
  lowStockAtOrBelow,
  archived = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  // Only products whose stock is at or below this (the "Low stock" filter)
  lowStockAtOrBelow?: number;
  archived?: boolean;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { result, archiving } = await queryByArchived(archived, (isArchived) => {
    let query = supabaseAdmin
      .from("products")
      .select("*, categories(categorie_name), brands(brand_name)", { count: "exact" })
      .order("product_id", { ascending: false })
      .range(from, to);

    if (isArchived !== null) {
      query = query.eq("is_archived", isArchived);
    }

    if (search) {
      query = query.ilike("product_name", `%${search}%`);
    }

    if (lowStockAtOrBelow !== undefined) {
      query = query.lte("in_stock_vailable", lowStockAtOrBelow);
    }

    return query;
  });

  if (!result || result.error) {
    if (result?.error) console.error("Error fetching products:", result.error);
    return { data: [], count: 0, archiving };
  }

  // Table fields, plus the raw columns
  const formattedData = (result.data || []).map((item) => ({
    ...item,
    id: item.product_id,
    product: item.product_name,
    category: item.categories?.categorie_name || "",
    price: item.unite_price,
    brand: item.brands?.brand_name || "",
    archived,
  }));

  return { data: formattedData, count: result.count || 0, archiving };
}

// A single product for the edit modal, or null.
export async function getProductById(productId: number) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) console.error("Error fetching product:", error);
  return data ?? null;
}

// Every product name (archived ones too), for spotting duplicates in a CSV import.
export async function getProductNames(): Promise<string[]> {
  const names: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("product_name")
      .order("product_id")
      .range(from, from + 999);
    if (error) throw error;
    names.push(...(data ?? []).map((row) => row.product_name ?? ""));
    if (!data || data.length < 1000) return names;
  }
}

// Options for the category and brand pickers in the product form: the active ones,
// plus the edited product's own category and brand even if they were archived.
export async function getProductFormOptions(current?: { categoryId: number | null; brandId: number | null }) {
  // "active, or this id", so an archived current value still shows as selected
  const activeOr = (idColumn: string, id: number | null | undefined) =>
    id ? `is_archived.eq.false,${idColumn}.eq.${id}` : "is_archived.eq.false";

  const [categories, brands] = await Promise.all([
    queryByArchived(false, (isArchived) => {
      const query = supabaseAdmin.from("categories").select("categorie_id, categorie_name").order("categorie_name");
      return isArchived === null ? query : query.or(activeOr("categorie_id", current?.categoryId));
    }),
    queryByArchived(false, (isArchived) => {
      const query = supabaseAdmin.from("brands").select("brand_id, brand_name").order("brand_name");
      return isArchived === null ? query : query.or(activeOr("brand_id", current?.brandId));
    }),
  ]);

  return { categories: categories.result?.data ?? [], brands: brands.result?.data ?? [] };
}
