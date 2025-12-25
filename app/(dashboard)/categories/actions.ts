"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addCategory(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("categoryName") as string;

  if (!name) {
    return { success: false, message: "Category name is required" };
  }

  const { error } = await supabase
    .from("categories")
    .insert([{ categorie_name: name }]);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/categories");
  return { success: true, message: "Category added successfully" };
}

export async function updateCategory(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = formData.get("categoryName") as string;

  if (!id || !name) {
    return { success: false, message: "ID and Name are required" };
  }

  const { error } = await supabase
    .from("categories")
    .update({ categorie_name: name })
    .eq("categorie_id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/categories");
  return { success: true, message: "Category updated successfully" };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("categorie_id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/categories");
  return { success: true, message: "Category deleted successfully" };
}
