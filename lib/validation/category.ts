import { z } from "zod";
import { existingImageUrl, optionalImage } from "./form";

const categoryName = z
  .string({ error: "categoryNameRequired" })
  .trim()
  .min(1, "categoryNameRequired")
  .max(100, "categoryNameTooLong");

// Fields posted by components/CategoryForm.tsx and the legacy add/edit category pages.
export const categorySchema = z.object({
  categoryName,
  categoryImage: optionalImage,
  existingImageUrl,
});

export const categoryUpdateSchema = categorySchema.extend({
  id: z.coerce.number({ error: "categoryNotFound" }).int("categoryNotFound").positive("categoryNotFound"),
});
