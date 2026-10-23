import { describe, expect, it } from "vitest";
import { CATEGORY_IMAGES, PRODUCT_IMAGES, deletableImagePath, newImagePath } from "@/lib/storage-path";

const project = "https://abc.supabase.co";
const publicUrl = (bucket: string, path: string) => `${project}/storage/v1/object/public/${bucket}/${path}`;

describe("newImagePath", () => {
  it("puts uploads in the target's folder", () => {
    expect(newImagePath(PRODUCT_IMAGES, "png", "id1")).toBe("id1.png");
    expect(newImagePath(CATEGORY_IMAGES, "webp", "id2")).toBe("categories/id2.webp");
  });

  it("uses a fresh UUID by default", () => {
    expect(newImagePath(PRODUCT_IMAGES, "jpg")).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(newImagePath(PRODUCT_IMAGES, "jpg")).not.toBe(newImagePath(PRODUCT_IMAGES, "jpg"));
  });
});

describe("deletableImagePath", () => {
  it("returns the object path of this project's product images", () => {
    expect(deletableImagePath(publicUrl("products", "abc123.png"), PRODUCT_IMAGES, project)).toBe("abc123.png");
  });

  it("only returns category images inside the categories folder", () => {
    expect(deletableImagePath(publicUrl("StaticAssests", "categories/x.png"), CATEGORY_IMAGES, project)).toBe(
      "categories/x.png",
    );
    // Bucket-root files may be the mobile app's own assets
    expect(deletableImagePath(publicUrl("StaticAssests", "banner.png"), CATEGORY_IMAGES, project)).toBeNull();
    expect(deletableImagePath(publicUrl("StaticAssests", "categories/../logo.png"), CATEGORY_IMAGES, project)).toBeNull();
    expect(deletableImagePath(publicUrl("StaticAssests", "categories/%2e%2e/logo.png"), CATEGORY_IMAGES, project)).toBeNull();
  });

  it("rejects other buckets, projects and external images", () => {
    expect(deletableImagePath(publicUrl("StaticAssests", "x.png"), PRODUCT_IMAGES, project)).toBeNull();
    expect(deletableImagePath(publicUrl("products-old", "x.png"), PRODUCT_IMAGES, project)).toBeNull();
    expect(
      deletableImagePath("https://other.supabase.co/storage/v1/object/public/products/x.png", PRODUCT_IMAGES, project),
    ).toBeNull();
    expect(deletableImagePath("https://cdn.example.com/products/x.png", PRODUCT_IMAGES, project)).toBeNull();
  });

  it("rejects transformed, signed or malformed URLs", () => {
    expect(deletableImagePath(`${publicUrl("products", "x.png")}?width=100`, PRODUCT_IMAGES, project)).toBeNull();
    expect(deletableImagePath(`${project}/storage/v1/object/sign/products/x.png`, PRODUCT_IMAGES, project)).toBeNull();
    expect(deletableImagePath(publicUrl("products", ""), PRODUCT_IMAGES, project)).toBeNull();
    expect(deletableImagePath(publicUrl("products", "a//b.png"), PRODUCT_IMAGES, project)).toBeNull();
    expect(deletableImagePath("not a url", PRODUCT_IMAGES, project)).toBeNull();
    expect(deletableImagePath(publicUrl("products", "x.png"), PRODUCT_IMAGES, "")).toBeNull();
    expect(deletableImagePath(null, PRODUCT_IMAGES, project)).toBeNull();
    expect(deletableImagePath("", PRODUCT_IMAGES, project)).toBeNull();
  });

  it("decodes what getPublicUrl encoded", () => {
    expect(deletableImagePath(publicUrl("products", "my%20photo.png"), PRODUCT_IMAGES, project)).toBe("my photo.png");
  });
});
