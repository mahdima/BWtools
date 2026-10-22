import { z } from "zod";
import { existingImageUrl, optionalImage } from "./form";

const categoryName = z
  .string({ error: "Category name is required." })
  .trim()
  .min(1, "Category name is required.")
  .max(100, "Category name must be 100 characters or fewer.");

// Fields posted by components/CategoryForm.tsx and the legacy add/edit category pages.
export const categorySchema = z.object({
  categoryName,
  categoryImage: optionalImage,
  existingImageUrl,
});

export const categoryUpdateSchema = categorySchema.extend({
  id: z.coerce.number({ error: "Category not found." }).int("Category not found.").positive("Category not found."),
});
