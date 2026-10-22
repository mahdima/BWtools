import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// All brands for the brands table, by id.
export async function getBrands() {
  const { data, error } = await supabaseAdmin.from("brands").select("*").order("brand_id");

  if (error) {
    console.error("Error fetching brands:", error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.brand_id,
    brand: item.brand_name,
  }));
}

// A single brand for the edit modal, or null.
export async function getBrandById(brandId: number) {
  const { data, error } = await supabaseAdmin.from("brands").select("*").eq("brand_id", brandId).maybeSingle();

  if (error) console.error("Error fetching brand:", error);
  return data ?? null;
}
