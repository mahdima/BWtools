import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// One page of brands by id, optionally filtered by name.
export async function getBrands({
  page = 1,
  limit = 20,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) {
  const from = (page - 1) * limit;

  let query = supabaseAdmin
    .from("brands")
    .select("*", { count: "exact" })
    .order("brand_id")
    .range(from, from + limit - 1);

  const term = search.trim();
  if (term) {
    // Escape LIKE wildcards so "%" and "_" match themselves
    query = query.ilike("brand_name", `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching brands:", error);
    return { data: [], count: 0 };
  }

  return {
    data: (data || []).map((item) => ({ id: item.brand_id, brand: item.brand_name })),
    count: count ?? 0,
  };
}

// A single brand for the edit modal, or null.
export async function getBrandById(brandId: number) {
  const { data, error } = await supabaseAdmin.from("brands").select("*").eq("brand_id", brandId).maybeSingle();

  if (error) console.error("Error fetching brand:", error);
  return data ?? null;
}
