// Where the dashboard stores uploaded images, and which stored files it may delete.
// Pure (no Supabase client) so it can be unit-tested; lib/image-storage.ts does the I/O.

export type ImageTarget = {
  bucket: string;
  // Uploads go into this folder ("" = bucket root), and only files inside it are ever deleted
  folder: string;
};

// `products` holds nothing but product images, so any file in it can be cleaned up.
export const PRODUCT_IMAGES: ImageTarget = { bucket: "products", folder: "" };

// `StaticAssests` (sic) also holds files the mobile app uses directly, so category
// images get their own folder and nothing outside it is deleted. Images uploaded to
// the bucket root before P6-07 are therefore left in place when replaced.
export const CATEGORY_IMAGES: ImageTarget = { bucket: "StaticAssests", folder: "categories/" };

// Object path for a new upload, e.g. "categories/1b9d6bcd-....png".
export function newImagePath(target: ImageTarget, extension: string, id: string = crypto.randomUUID()): string {
  return `${target.folder}${id}.${extension}`;
}

// The object path of a file the dashboard may delete, taken from its public URL
// ("<supabase url>/storage/v1/object/public/<bucket>/<path>"), or null for anything
// else: another project or bucket, an external image, or a file outside the folder.
export function deletableImagePath(
  url: string | null | undefined,
  target: ImageTarget,
  supabaseUrl: string,
): string | null {
  if (!url) return null;

  let parsed: URL;
  let project: URL;
  try {
    parsed = new URL(url);
    project = new URL(supabaseUrl);
  } catch {
    return null;
  }
  // getPublicUrl() never adds a query or fragment (no transforms are used)
  if (parsed.origin !== project.origin || parsed.search || parsed.hash) return null;

  const prefix = `/storage/v1/object/public/${encodeURI(target.bucket)}/`;
  if (!parsed.pathname.startsWith(prefix)) return null;

  // getPublicUrl() runs the URL through encodeURI(), so undo exactly that
  let path: string;
  try {
    path = decodeURI(parsed.pathname.slice(prefix.length));
  } catch {
    return null;
  }

  if (path.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) return null;
  return path.startsWith(target.folder) ? path : null;
}
