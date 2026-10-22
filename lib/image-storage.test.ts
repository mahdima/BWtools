import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A fake supabaseAdmin: `uses` is how many rows each table has with the URL
const db = vi.hoisted(() => ({
  uses: { products: 0, categories: 0, brands: 0 } as Record<string, number>,
  countError: null as { message: string } | null,
  remove: vi.fn<(paths: string[]) => Promise<{ data: unknown[]; error: { message: string } | null }>>(async () => ({
    data: [],
    error: null,
  })),
  upload: vi.fn<(path: string, file: File, options: unknown) => Promise<{ error: { message: string } | null }>>(
    async () => ({ error: null }),
  ),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table: string) => ({
      select: () => ({
        eq: async () => ({ count: db.countError ? null : db.uses[table], error: db.countError }),
      }),
    }),
    storage: {
      from: (bucket: string) => ({
        remove: db.remove,
        upload: db.upload,
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://abc.supabase.co/storage/v1/object/public/${bucket}/${path}` },
        }),
      }),
    },
  },
}));

import { removeUnusedImage, uploadImage } from "@/lib/image-storage";
import { CATEGORY_IMAGES, PRODUCT_IMAGES } from "@/lib/storage-path";

const productUrl = "https://abc.supabase.co/storage/v1/object/public/products/old.png";

describe("removeUnusedImage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    db.uses = { products: 0, categories: 0, brands: 0 };
    db.countError = null;
    db.remove.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("deletes an image no row uses", async () => {
    await removeUnusedImage(PRODUCT_IMAGES, productUrl);
    expect(db.remove).toHaveBeenCalledWith(["old.png"]);
  });

  it("keeps an image another row still uses", async () => {
    db.uses.categories = 1;
    await removeUnusedImage(PRODUCT_IMAGES, productUrl);
    expect(db.remove).not.toHaveBeenCalled();
  });

  it("keeps the image when its uses can't be checked", async () => {
    db.countError = { message: "timeout" };
    await removeUnusedImage(PRODUCT_IMAGES, productUrl);
    expect(db.remove).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("never touches files outside the dashboard's folder", async () => {
    await removeUnusedImage(CATEGORY_IMAGES, "https://abc.supabase.co/storage/v1/object/public/StaticAssests/logo.png");
    await removeUnusedImage(PRODUCT_IMAGES, "https://cdn.example.com/x.png");
    await removeUnusedImage(PRODUCT_IMAGES, null);
    expect(db.remove).not.toHaveBeenCalled();
  });

  it("logs instead of throwing when the delete fails", async () => {
    db.remove.mockResolvedValueOnce({ data: [], error: { message: "denied" } });
    await expect(removeUnusedImage(PRODUCT_IMAGES, productUrl)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});

describe("uploadImage", () => {
  beforeEach(() => db.upload.mockClear());

  it("uploads into the target's folder and returns the public URL", async () => {
    const file = new File(["x"], "photo.PNG", { type: "image/png" });
    const url = await uploadImage(CATEGORY_IMAGES, file);
    const [path, , options] = db.upload.mock.calls[0];
    expect(path).toMatch(/^categories\/[0-9a-f-]{36}\.png$/);
    expect(options).toEqual({ contentType: "image/png" });
    expect(url).toBe(`https://abc.supabase.co/storage/v1/object/public/StaticAssests/${path}`);
  });

  it("throws a message for the user when the upload fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.upload.mockResolvedValueOnce({ error: { message: "Bucket not found" } });
    await expect(uploadImage(PRODUCT_IMAGES, new File(["x"], "a.jpg", { type: "image/jpeg" }))).rejects.toThrow(
      "Failed to upload the image: Bucket not found",
    );
  });
});
