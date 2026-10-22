import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// All categories for the categories table, by id.
export async function getCategories() {
  const { data, error } = await supabaseAdmin.from("categories").select("*").order("categorie_id");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.categorie_id,
    category: item.categorie_name,
    image: item.cat_image_url,
  }));
}
