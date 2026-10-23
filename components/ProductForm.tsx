"use client";

import { Button } from "@/components/ui/button";
import { ProductImageUpload } from "@/components/ProductImageUpload";
import Editor from "@/components/editor";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import { useFormAction } from "@/lib/use-form-action";
import { useTranslations } from "next-intl";

interface ProductFormProps {
  categories: any[];
  brands: any[];
  product?: any;
  // Server action: returns an error to show, or redirects on success
  action: (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  title: string;
  page?: string | string[];
}

export function ProductForm({
  categories,
  brands,
  product,
  action,
  title,
  page,
}: ProductFormProps) {
  const [description, setDescription] = useState(product?.description || "");
  const t = useTranslations("products.form");
  const tc = useTranslations("common");
  const { state, isPending, onSubmit } = useFormAction(action);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-foreground">{title}</h1>

      <form onSubmit={onSubmit} className="glass-card rounded-lg">
        <input
          type="hidden"
          name="page"
          value={Array.isArray(page) ? page[0] : page || ""}
        />
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side: Form Fields */}
          <div className="flex-1 space-y-5">
            {/* Product Name */}
            <div>
              <label
                htmlFor="product"
                className="block text-sm font-semibold text-foreground/80 mb-2"
              >
                {t("name")}
              </label>
              <input
                type="text"
                id="product"
                name="product"
                defaultValue={product?.product_name || ""}
                className="px-4 py-2 block w-full rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary h-11 text-sm text-foreground/80 outline-none transition-all bg-muted/40 focus:bg-card"
                placeholder={t("namePlaceholder")}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-foreground/80 mb-2"
              >
                {t("category")}
              </label>
              <select
                id="category"
                name="category"
                defaultValue={product?.Category_id || ""}
                className="px-4 py-2 block w-full rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary h-11 text-sm text-foreground/80 outline-none transition-all bg-muted/40 focus:bg-card"
                required
              >
                <option value="" disabled>
                  {t("selectCategory")}
                </option>
                {categories.map((cat: any) => (
                  <option key={cat.categorie_id} value={cat.categorie_id}>
                    {cat.categorie_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price, Quantity, Brand Row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-semibold text-foreground/80 mb-2"
                >
                  {t("price")}
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  defaultValue={product?.unite_price ?? ""}
                  className="px-4 py-2 block w-full rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary h-11 text-sm text-foreground/80 outline-none transition-all bg-muted/40 focus:bg-card"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-semibold text-foreground/80 mb-2"
                >
                  {t("quantity")}
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  defaultValue={product?.in_stock_vailable ?? ""}
                  className="px-4 py-2 block w-full rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary h-11 text-sm text-foreground/80 outline-none transition-all bg-muted/40 focus:bg-card"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="brand"
                  className="block text-sm font-semibold text-foreground/80 mb-2"
                >
                  {t("brand")}
                </label>
                <select
                  id="brand"
                  name="brand"
                  defaultValue={product?.brand_id || ""}
                  className="px-4 py-2 block w-full rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary h-11 text-sm text-foreground/80 outline-none transition-all bg-muted/40 focus:bg-card"
                  required
                >
                  <option value="" disabled>
                    {t("selectBrand")}
                  </option>
                  {brands.map((brand: any) => (
                    <option key={brand.brand_id} value={brand.brand_id}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-foreground/80 mb-2"
              >
                {t("description")}
              </label>
              <Editor value={description} onChange={setDescription} />
              <input type="hidden" name="description" value={description} />
            </div>
          </div>

          {/* Right Side: Image Upload */}
          <div className="w-full lg:w-1/3 flex flex-col">
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              {t("image")}
            </label>
            <div className="bg-muted/40 rounded-lg border border-dashed border-border p-4 h-full min-h-[300px] flex items-center justify-center">
              <ProductImageUpload
                key={product?.product_link}
                defaultValue={product?.product_link}
                name="productImage"
              />
            </div>
          </div>
        </div>

        {state && !state.success && (
          <div role="alert" className="mt-6 p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
            {state.message}
          </div>
        )}

        {/* Bottom Buttons */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-border justify-end">
          <Link href="/product">
            <Button
              type="button"
              variant="ghost"
              className="px-8 h-11 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {tc("cancel")}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="px-8 h-11 bg-primary text-white hover:bg-primary-strong shadow-lg shadow-blue-500/20"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? t("update") : t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
