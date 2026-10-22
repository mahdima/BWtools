import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { queryByArchived } from "@/lib/archive";

// One page of brands by id, optionally filtered by name. Active brands by default, or
// the archived ones; `archiving` is false until the is_archived column exists.
export async function getBrands({
  page = 1,
  limit = 20,
  search = "",
  archived = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  archived?: boolean;
} = {}) {
  const from = (page - 1) * limit;
  const term = search.trim();

  const { result, archiving } = await queryByArchived(archived, (isArchived) => {
    let query = supabaseAdmin
      .from("brands")
      .select("*", { count: "exact" })
      .order("brand_id")
      .range(from, from + limit - 1);

    if (isArchived !== null) {
      query = query.eq("is_archived", isArchived);
    }

    if (term) {
      // Escape LIKE wildcards so "%" and "_" match themselves
      query = query.ilike("brand_name", `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    }

    return query;
  });

  if (!result || result.error) {
    if (result?.error) console.error("Error fetching brands:", result.error);
    return { data: [], count: 0, archiving };
  }

  return {
    data: (result.data || []).map((item) => ({ id: item.brand_id, brand: item.brand_name, archived })),
    count: result.count ?? 0,
    archiving,
  };
}

// A single brand for the edit modal, or null.
export async function getBrandById(brandId: number) {
  const { data, error } = await supabaseAdmin.from("brands").select("*").eq("brand_id", brandId).maybeSingle();

  if (error) console.error("Error fetching brand:", error);
  return data ?? null;
}
