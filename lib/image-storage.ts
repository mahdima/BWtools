import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { imageExtension } from "@/lib/validation/form";
import { deletableImagePath, newImagePath, type ImageTarget } from "@/lib/storage-path";

// Uploads an image that passed `optionalImage` and returns its public URL. Throws with
// the storage error's message (actions wrap it in "actions.common.uploadFailed").
export async function uploadImage(target: ImageTarget, file: File): Promise<string> {
  const path = newImagePath(target, imageExtension(file));

  const { error } = await supabaseAdmin.storage.from(target.bucket).upload(path, file, { contentType: file.type });
  if (error) {
    console.error(`Error uploading an image to '${target.bucket}':`, error);
    throw new Error(error.message);
  }

  return supabaseAdmin.storage.from(target.bucket).getPublicUrl(path).data.publicUrl;
}

// Deletes an image nothing uses any more. Call it after the row that pointed to it was
// changed or deleted (or failed to save, for a fresh upload). Skips files the dashboard
// doesn't own (see deletableImagePath) and files any product, category or brand still
// uses. Never throws: a leftover file is harmless, a failed save because of one is not.
export async function removeUnusedImage(target: ImageTarget, url: string | null | undefined): Promise<void> {
  const path = deletableImagePath(url, target, process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (!url || !path) return;

  try {
    const head = { count: "exact", head: true } as const;
    const uses = await Promise.all([
      supabaseAdmin.from("products").select("product_id", head).eq("product_link", url),
      supabaseAdmin.from("categories").select("categorie_id", head).eq("cat_image_url", url),
      supabaseAdmin.from("brands").select("brand_id", head).eq("brand_image_url", url),
    ]);

    const failed = uses.find((result) => result.error);
    if (failed) {
      console.error("Kept an old image because its uses couldn't be checked:", path, failed.error);
      return;
    }
    if (uses.some((result) => result.count !== 0)) return;

    const { error } = await supabaseAdmin.storage.from(target.bucket).remove([path]);
    if (error) console.error("Failed to delete an old image:", path, error);
  } catch (error) {
    console.error("Failed to delete an old image:", path, error);
  }
}
