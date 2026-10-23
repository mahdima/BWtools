import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, imageExtension, optionalImage, parseForm } from "@/lib/validation/form";
import { productSchema } from "@/lib/validation/product";
import { brandSchema } from "@/lib/validation/brand";
import { categorySchema, categoryUpdateSchema } from "@/lib/validation/category";
import { customerSchema } from "@/lib/validation/customer";
import { adminCreateSchema, passwordChangeSchema, profileSchema } from "@/lib/validation/admin";
import { orderNoteSchema } from "@/lib/validation/order";
import en from "@/messages/en.json";

// Schemas report keys; tests read them as the English text the admin sees
const english = (key: string) => (en.validation as Record<string, unknown>)[key] ?? key;

function form(fields: Record<string, string | File>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.append(key, value);
  return fd;
}

const file = (type: string, size = 10, name = "pic") => new File([new Uint8Array(size)], name, { type });
const emptyFileInput = () => new File([], "", { type: "application/octet-stream" });

// Returns the error message, or "" when the input is valid.
function errorOf(schema: Parameters<typeof parseForm>[0], input: FormData | Record<string, unknown>) {
  const result = parseForm(schema, input);
  return result.success ? "" : english(result.message);
}

describe("optionalImage", () => {
  it("treats an empty file input as no image", () => {
    expect(optionalImage.parse(emptyFileInput())).toBeUndefined();
    expect(optionalImage.parse(undefined)).toBeUndefined();
  });

  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (type) => {
    expect(optionalImage.safeParse(file(type)).success).toBe(true);
  });

  it("rejects other types and oversized files", () => {
    expect(english(optionalImage.safeParse(file("image/gif")).error?.issues[0].message ?? "")).toBe(
      "Image must be a JPEG, PNG or WebP file.",
    );
    expect(optionalImage.safeParse(file("image/svg+xml")).success).toBe(false);
    expect(english(optionalImage.safeParse(file("image/png", MAX_IMAGE_BYTES + 1)).error?.issues[0].message ?? "")).toBe(
      "Image must be 5 MB or smaller.",
    );
  });

  it("takes the extension from the MIME type, not the file name", () => {
    expect(imageExtension(file("image/png", 10, "evil.php"))).toBe("png");
    expect(imageExtension(file("image/jpeg"))).toBe("jpg");
  });
});

describe("productSchema", () => {
  const valid = { product: "  Hammer ", category: "2", brand: "3", price: "1500.50", quantity: "0", description: "<p>x</p>" };

  it("parses and coerces a valid product form", () => {
    const result = parseForm(productSchema, form({ ...valid, productImage: emptyFileInput() }));
    expect(result).toEqual({
      success: true,
      data: { product: "Hammer", category: 2, brand: 3, price: 1500.5, quantity: 0, description: "<p>x</p>" },
    });
  });

  it.each([
    [{ product: "   " }, "Product name is required."],
    [{ category: "" }, "Choose a category."],
    [{ brand: "abc" }, "Choose a brand."],
    [{ price: "0" }, "Price must be greater than 0."],
    [{ price: "-5" }, "Price must be greater than 0."],
    [{ price: "ten" }, "Price must be a number."],
    [{ quantity: "-1" }, "Quantity cannot be negative."],
    [{ quantity: "1.5" }, "Quantity must be a whole number."],
    [{ existingImageUrl: "javascript:alert(1)" }, "Image URL is invalid."],
  ])("rejects %j", (override, message) => {
    expect(errorOf(productSchema, form({ ...valid, ...override }))).toBe(message);
  });

  it("rejects a non-image upload", () => {
    expect(errorOf(productSchema, form({ ...valid, productImage: file("text/html") }))).toBe(
      "Image must be a JPEG, PNG or WebP file.",
    );
  });
});

describe("brand and category schemas", () => {
  it("trims names and rejects blank ones", () => {
    expect(parseForm(brandSchema, form({ brand: " Bosch " }))).toEqual({ success: true, data: { brand: "Bosch" } });
    expect(errorOf(brandSchema, form({ brand: "  " }))).toBe("Brand name is required.");
    expect(errorOf(categorySchema, form({}))).toBe("Category name is required.");
  });

  it("requires a valid id to update a category", () => {
    expect(errorOf(categoryUpdateSchema, form({ categoryName: "Tools", id: "x" }))).toBe("Category not found.");
    expect(parseForm(categoryUpdateSchema, form({ categoryName: "Tools", id: "4" }))).toMatchObject({
      success: true,
      data: { id: 4, categoryName: "Tools" },
    });
  });
});

describe("customerSchema", () => {
  const id = "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90";

  it("accepts optional username and phone", () => {
    expect(errorOf(customerSchema, form({ id, username: "", phone: "" }))).toBe("");
    expect(errorOf(customerSchema, form({ id, phone: "+213 555 12-34-56" }))).toBe("");
  });

  it("rejects a bad id or phone", () => {
    expect(errorOf(customerSchema, form({ id: "1" }))).toBe("Customer not found.");
    expect(errorOf(customerSchema, form({ id, phone: "call me" }))).toBe("Phone number is invalid.");
  });
});

describe("admin schemas", () => {
  const valid = { fullName: "Amina", email: "amina@example.com", password: "longenough", role: "admin" };

  it("accepts a valid new admin", () => {
    expect(errorOf(adminCreateSchema, form(valid))).toBe("");
  });

  it.each([
    [{ email: "not-an-email" }, "Enter a valid email address."],
    [{ password: "short" }, "Password must be at least 8 characters."],
    [{ password: "x".repeat(73) }, "Password must be 72 characters or fewer."],
    [{ role: "editor" }, "Choose a valid role."],
    [{ fullName: "" }, "Full name is required."],
  ])("rejects %j", (override, message) => {
    expect(errorOf(adminCreateSchema, form({ ...valid, ...override }))).toBe(message);
  });

  it("allows an empty email on the profile form", () => {
    expect(errorOf(profileSchema, form({ fullName: "Amina", email: "" }))).toBe("");
    expect(errorOf(profileSchema, form({ fullName: "Amina", email: "nope" }))).toBe("Enter a valid email address.");
  });

  it("requires matching passwords", () => {
    expect(errorOf(passwordChangeSchema, form({ password: "longenough", confirmPassword: "different" }))).toBe(
      "Passwords do not match.",
    );
    expect(errorOf(passwordChangeSchema, form({ password: "longenough", confirmPassword: "longenough" }))).toBe("");
  });
});

describe("orderNoteSchema", () => {
  it("rejects blank notes and trims the rest", () => {
    expect(errorOf(orderNoteSchema, { note: "   " })).toBe("Note cannot be empty.");
    expect(parseForm(orderNoteSchema, { note: " Called customer " })).toEqual({
      success: true,
      data: { note: "Called customer" },
    });
  });
});
