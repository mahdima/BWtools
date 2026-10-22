"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { imageExtension, parseForm } from "@/lib/validation/form";
import { categorySchema, categoryUpdateSchema } from "@/lib/validation/category";
import { NOT_AUTHORIZED, isForeignKeyViolation, type ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";

// Uploads a validated image to the `StaticAssests` bucket (sic) and returns its public URL.
async function uploadCategoryImage(imageFile: File): Promise<string> {
  const filePath = `${Math.random().toString(36).substring(2)}.${imageExtension(imageFile)}`;

  const { error } = await supabaseAdmin.storage
    .from("StaticAssests")
    .upload(filePath, imageFile, { contentType: imageFile.type });

  if (error) {
    console.error("Error uploading category image:", error);
    throw new Error(`Failed to upload category image: ${error.message}`);
  }

  return supabaseAdmin.storage.from("StaticAssests").getPublicUrl(filePath).data.publicUrl;
}

export async function addCategory(formData: FormData): Promise<ActionResult> {
  if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

  const parsed = parseForm(categorySchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { categoryName, categoryImage } = parsed.data;

  let cat_image_url: string | null = null;
  if (categoryImage) {
    try {
      cat_image_url = await uploadCategoryImage(categoryImage);
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .insert([{ categorie_name: categoryName, cat_image_url }]);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/categories");
  return { success: true, message: "Category added successfully" };
}

export async function updateCategory(formData: FormData): Promise<ActionResult> {
  if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

  const parsed = parseForm(categoryUpdateSchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { id, categoryName, categoryImage, existingImageUrl } = parsed.data;

  // A new file replaces the image; otherwise keep the current URL (empty when removed)
  let cat_image_url = existingImageUrl || null;
  if (categoryImage) {
    try {
      cat_image_url = await uploadCategoryImage(categoryImage);
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .update({ categorie_name: categoryName, cat_image_url })
    .eq("categorie_id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/categories");
  return { success: true, message: "Category updated successfully" };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

  // Ask for the deleted rows back, so "nothing was deleted" is reported, not hidden
  const { data, error } = await supabaseAdmin
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
    return { success: false, message: "Category not found." };
  }

  revalidatePath("/categories");
  return { success: true, message: "Category deleted successfully" };
}
