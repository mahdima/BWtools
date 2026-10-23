import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { queryByArchived } from "@/lib/archive";

// All active (or all archived) categories for the categories table, by id.
// `archiving` is false until the is_archived column exists.
export async function getCategories({ archived = false }: { archived?: boolean } = {}) {
  const { result, archiving } = await queryByArchived(archived, (isArchived) => {
    const query = supabaseAdmin.from("categories").select("*").order("categorie_id");
    return isArchived === null ? query : query.eq("is_archived", isArchived);
  });

  if (!result || result.error) {
    if (result?.error) console.error("Error fetching categories:", result.error);
    return { data: [], archiving };
  }

  return {
    data: (result.data || []).map((item) => ({
      id: item.categorie_id,
      category: item.categorie_name,
      image: item.cat_image_url,
      archived,
    })),
    archiving,
  };
}
