"use server";

import { getTranslations } from "next-intl/server";
import { notAuthorized, parseFormT, uploadFailed } from "@/lib/server-messages";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { categorySchema, categoryUpdateSchema } from "@/lib/validation/category";
import { isForeignKeyViolation, type ActionResult } from "@/lib/action-result";
import { removeUnusedImage, uploadImage } from "@/lib/image-storage";
import { CATEGORY_IMAGES } from "@/lib/storage-path";
import { archiveResult, hasActiveProducts, setArchived } from "@/lib/archive";
import { logAudit } from "@/lib/audit";
import { diffChanges } from "@/lib/audit-changes";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

// Deletes a category image that's no longer used, after the response is sent.
function cleanUpImage(url: string | null | undefined) {
  after(() => removeUnusedImage(CATEGORY_IMAGES, url));
}

export async function addCategory(formData: FormData): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin("admin");
  if (!admin) return notAuthorized();
  const t = await getTranslations("actions.categories");

  const parsed = await parseFormT(categorySchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { categoryName, categoryImage } = parsed.data;

  let cat_image_url: string | null = null;
  if (categoryImage) {
    try {
      cat_image_url = await uploadImage(CATEGORY_IMAGES, categoryImage);
    } catch (error) {
      return uploadFailed(error);
    }
  }

  const { data: created, error } = await supabaseAdmin
    .from("categories")
    .insert([{ categorie_name: categoryName, cat_image_url }])
    .select("categorie_id")
    .single();

  if (error) {
    cleanUpImage(cat_image_url); // the upload belongs to no category
    return { success: false, message: error.message };
  }

  logAudit(admin.id, "create", "category", created.categorie_id, { categorie_name: categoryName });
  revalidatePath("/categories");
  return { success: true, message: t("added") };
}

export async function updateCategory(formData: FormData): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin("admin");
  if (!admin) return notAuthorized();
  const t = await getTranslations("actions.categories");

  const parsed = await parseFormT(categoryUpdateSchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { id, categoryName, categoryImage, existingImageUrl } = parsed.data;

  const { data: current, error: readError } = await supabaseAdmin
    .from("categories")
    .select("categorie_name, cat_image_url")
    .eq("categorie_id", id)
    .maybeSingle();

  if (readError) {
    return { success: false, message: readError.message };
  }
  if (!current) {
    return { success: false, message: t("notFound") };
  }

  // A new file replaces the image. Otherwise the form's existingImageUrl says whether
  // to keep the current one (empty = removed); the URL itself comes from the database.
  let cat_image_url = existingImageUrl ? current.cat_image_url : null;
  if (categoryImage) {
    try {
      cat_image_url = await uploadImage(CATEGORY_IMAGES, categoryImage);
    } catch (error) {
      return uploadFailed(error);
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
  logAudit(admin.id, "update", "category", id, diffChanges(current, { categorie_name: categoryName, cat_image_url }));
  revalidatePath("/categories");
  return { success: true, message: t("updated") };
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin("admin");
  if (!admin) return notAuthorized();
  const t = await getTranslations("actions.categories");

  const id = Number(categoryId);
  if (!Number.isInteger(id)) {
    return { success: false, message: t("notFound") };
  }

  // Ask for the deleted rows back, so "nothing was deleted" is reported, not hidden
  const { data, error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("categorie_id", id)
    .select("categorie_id, categorie_name, cat_image_url");

  if (error) {
    if (!isForeignKeyViolation(error)) return { success: false, message: error.message };

    // Products still point to it. If they're all archived, archive the category too (P6-08)
    const stillHasProducts = t("stillHasProducts");
    if ((await hasActiveProducts("Category_id", id)) !== false) return { success: false, message: stillHasProducts };

    const result = archiveResult(await setArchived("categories", id, true), {
      done: t("archivedInstead"),
      notFound: t("notFound"),
      unavailable: stillHasProducts,
      failed: (error) => t("archiveFailed", { error }),
    });
    if (result.success) {
      logAudit(admin.id, "archive", "category", id);
      revalidatePath("/categories");
    }
    return result;
  }

  if (!data?.length) {
    return { success: false, message: t("notFound") };
  }

  cleanUpImage(data[0].cat_image_url);
  logAudit(admin.id, "delete", "category", id, { categorie_name: data[0].categorie_name });
  revalidatePath("/categories");
  return { success: true, message: t("deleted") };
}

export async function restoreCategory(categoryId: string): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin("admin");
  if (!admin) return notAuthorized();
  const t = await getTranslations("actions.categories");

  const id = Number(categoryId);
  if (!Number.isInteger(id)) {
    return { success: false, message: t("notFound") };
  }

  const result = archiveResult(await setArchived("categories", id, false), {
    done: t("restored"),
    notFound: t("notFound"),
    unavailable: (await getTranslations("actions.common"))("archivingUnavailable"),
    failed: (error) => t("restoreFailed", { error }),
  });
  if (result.success) {
    logAudit(admin.id, "restore", "category", id);
    revalidatePath("/categories");
  }
  return result;
}
