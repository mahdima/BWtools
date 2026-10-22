import { z } from "zod";
import { existingImageUrl, optionalImage } from "./form";

// Fields posted by components/ProductForm.tsx (add and edit).
export const productSchema = z.object({
  product: z
    .string({ error: "Product name is required." })
    .trim()
    .min(1, "Product name is required.")
    .max(200, "Product name must be 200 characters or fewer."),
  category: z.coerce.number({ error: "Choose a category." }).int("Choose a category.").positive("Choose a category."),
  brand: z.coerce.number({ error: "Choose a brand." }).int("Choose a brand.").positive("Choose a brand."),
  price: z.coerce
    .number({ error: "Price must be a number." })
    .positive("Price must be greater than 0.")
    .max(100_000_000, "Price is too large."),
  quantity: z.coerce
    .number({ error: "Quantity must be a number." })
    .int("Quantity must be a whole number.")
    .min(0, "Quantity cannot be negative."),
  description: z.string().max(20_000, "Description is too long.").optional(),
  productImage: optionalImage,
  existingImageUrl,
  page: z.string().optional(),
});

export type ProductInput = z.output<typeof productSchema>;
