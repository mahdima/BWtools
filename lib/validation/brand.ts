import { z } from "zod";

// Fields posted by components/BrandForm.tsx.
export const brandSchema = z.object({
  brand: z
    .string({ error: "Brand name is required." })
    .trim()
    .min(1, "Brand name is required.")
    .max(100, "Brand name must be 100 characters or fewer."),
});
