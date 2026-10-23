import { z } from "zod";

// Fields posted by components/BrandForm.tsx.
export const brandSchema = z.object({
  brand: z
    .string({ error: "brandNameRequired" })
    .trim()
    .min(1, "brandNameRequired")
    .max(100, "brandNameTooLong"),
});
