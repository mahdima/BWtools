import { z } from "zod";
import { existingImageUrl, optionalImage } from "./form";

// Fields posted by components/ProductForm.tsx (add and edit).
export const productSchema = z.object({
  product: z
    .string({ error: "productNameRequired" })
    .trim()
    .min(1, "productNameRequired")
    .max(200, "productNameTooLong"),
  category: z.coerce.number({ error: "chooseCategory" }).int("chooseCategory").positive("chooseCategory"),
  brand: z.coerce.number({ error: "chooseBrand" }).int("chooseBrand").positive("chooseBrand"),
  price: z.coerce
    .number({ error: "priceNotNumber" })
    .positive("priceNotPositive")
    .max(100_000_000, "priceTooLarge"),
  quantity: z.coerce
    .number({ error: "quantityNotNumber" })
    .int("quantityNotWhole")
    .min(0, "quantityNegative"),
  description: z.string().max(20_000, "descriptionTooLong").optional(),
  productImage: optionalImage,
  existingImageUrl,
  page: z.string().optional(),
});

export type ProductInput = z.output<typeof productSchema>;
