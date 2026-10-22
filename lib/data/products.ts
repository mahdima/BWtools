import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// One page of the products table, newest first, optionally filtered by name.
export async function getProducts({
  page = 1,
  limit = 20,
  search = "",
  lowStockAtOrBelow,
}: {
  page?: number;
  limit?: number;
  search?: string;
  // Only products whose stock is at or below this (the "Low stock" filter)
  lowStockAtOrBelow?: number;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("products")
    .select("*, categories(categorie_name), brands(brand_name)", { count: "exact" })
    .order("product_id", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike("product_name", `%${search}%`);
  }

  if (lowStockAtOrBelow !== undefined) {
    query = query.lte("in_stock_vailable", lowStockAtOrBelow);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { data: [], count: 0 };
  }

  // Table fields, plus the raw columns
  const formattedData = (data || []).map((item) => ({
    ...item,
    id: item.product_id,
    product: item.product_name,
    category: item.categories?.categorie_name || "",
    price: item.unite_price,
    brand: item.brands?.brand_name || "",
  }));

  return { data: formattedData, count: count || 0 };
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

// Options for the category and brand pickers in the product form.
export async function getProductFormOptions() {
  const [categories, brands] = await Promise.all([
    supabaseAdmin.from("categories").select("categorie_id, categorie_name").order("categorie_name"),
    supabaseAdmin.from("brands").select("brand_id, brand_name").order("brand_name"),
  ]);

  return { categories: categories.data ?? [], brands: brands.data ?? [] };
}
