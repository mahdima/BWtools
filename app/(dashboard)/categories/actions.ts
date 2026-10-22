"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/validation/form";
import { categorySchema, categoryUpdateSchema } from "@/lib/validation/category";
import { NOT_AUTHORIZED, isForeignKeyViolation, type ActionResult } from "@/lib/action-result";
import { removeUnusedImage, uploadImage } from "@/lib/image-storage";
import { CATEGORY_IMAGES } from "@/lib/storage-path";
import { archiveResult, hasActiveProducts, setArchived } from "@/lib/archive";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

// Deletes a category image that's no longer used, after the response is sent.
function cleanUpImage(url: string | null | undefined) {
  after(() => removeUnusedImage(CATEGORY_IMAGES, url));
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
      cat_image_url = await uploadImage(CATEGORY_IMAGES, categoryImage);
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .insert([{ categorie_name: categoryName, cat_image_url }]);

  if (error) {
    cleanUpImage(cat_image_url); // the upload belongs to no category
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

  const { data: current, error: readError } = await supabaseAdmin
    .from("categories")
    .select("cat_image_url")
    .eq("categorie_id", id)
    .maybeSingle();

  if (readError) {
    return { success: false, message: readError.message };
  }
  if (!current) {
    return { success: false, message: "Category not found." };
  }

  // A new file replaces the image. Otherwise the form's existingImageUrl says whether
  // to keep the current one (empty = removed); the URL itself comes from the database.
  let cat_image_url = existingImageUrl ? current.cat_image_url : null;
  if (categoryImage) {
    try {
      cat_image_url = await uploadImage(CATEGORY_IMAGES, categoryImage);
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .update({ categorie_name: categoryName, cat_image_url })
    .eq("categorie_id", id);

  if (error) {
    if (categoryImage) cleanUpImage(cat_image_url); // the new upload wasn't saved
    return { success: false, message: error.message };
  }

  if (current.cat_image_url !== cat_image_url) cleanUpImage(current.cat_image_url);
  revalidatePath("/categories");
  return { success: true, message: "Category updated successfully" };
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

  const id = Number(categoryId);
  if (!Number.isInteger(id)) {
    return { success: false, message: "Category not found." };
  }

  // Ask for the deleted rows back, so "nothing was deleted" is reported, not hidden
  const { data, error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("categorie_id", id)
    .select("categorie_id, cat_image_url");

  if (error) {
    if (!isForeignKeyViolation(error)) return { success: false, message: error.message };

    // Products still point to it. If they're all archived, archive the category too (P6-08)
    const stillHasProducts = "This category still has products. Move or delete them first.";
    if ((await hasActiveProducts("Category_id", id)) !== false) return { success: false, message: stillHasProducts };

    const result = archiveResult(await setArchived("categories", id, true), {
      done: "This category is used by archived products, so it was archived instead of deleted.",
      notFound: "Category not found.",
      unavailable: stillHasProducts,
      failed: "Failed to archive category",
    });
    if (result.success) revalidatePath("/categories");
    return result;
  }

  if (!data?.length) {
    return { success: false, message: "Category not found." };
  }

  cleanUpImage(data[0].cat_image_url);
  revalidatePath("/categories");
  return { success: true, message: "Category deleted successfully" };
}

export async function restoreCategory(categoryId: string): Promise<ActionResult> {
  if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

  const id = Number(categoryId);
  if (!Number.isInteger(id)) {
    return { success: false, message: "Category not found." };
  }

  const result = archiveResult(await setArchived("categories", id, false), {
    done: "Category restored.",
    notFound: "Category not found.",
    unavailable: "Archiving isn't set up yet.",
    failed: "Failed to restore category",
  });
  if (result.success) revalidatePath("/categories");
  return result;
}
