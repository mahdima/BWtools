"use server";

import { createClient } from "@/utils/supabase/server";
import { getAuthorizedAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/validation/form";
import { categorySchema, categoryUpdateSchema } from "@/lib/validation/category";
import { NOT_AUTHORIZED, isForeignKeyViolation, type ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";

export async function addCategory(formData: FormData) {
  if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

  const parsed = parseForm(categorySchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const name = parsed.data.categoryName;

  const supabase = await createClient();

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
  if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

  const parsed = parseForm(categoryUpdateSchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { id, categoryName: name } = parsed.data;

  const supabase = await createClient();

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

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

  const supabase = await createClient();

  // Ask for the deleted rows back: a delete blocked by RLS removes nothing without an error
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("categorie_id", Number(id))
    .select("categorie_id");

  if (error) {
    return {
      success: false,
      message: isForeignKeyViolation(error)
        ? "This category still has products. Move or delete them first."
        : error.message,
    };
  }

  if (!data?.length) {
    return { success: false, message: "Category not found, or you can't delete it." };
  }

  revalidatePath("/categories");
  return { success: true, message: "Category deleted successfully" };
}
