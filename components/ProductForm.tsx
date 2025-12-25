"use client";

import { Button } from "@/components/ui/button";
import { ProductImageUpload } from "@/components/ProductImageUpload";
import Link from "next/link";

interface ProductFormProps {
  categories: any[];
  brands: any[];
  product?: any;
  action: (formData: FormData) => Promise<void>;
  title: string;
}

export function ProductForm({
  categories,
  brands,
  product,
  action,
  title,
}: ProductFormProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#0B1DFF]">{title}</h1>

      <form action={action} className="bg-white rounded-lg">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side: Form Fields */}
          <div className="flex-1 space-y-5">
            {/* Product Name */}
            <div>
              <label
                htmlFor="product"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Product Name
              </label>
              <input
                type="text"
                id="product"
                name="product"
                defaultValue={product?.product_name || ""}
                className="px-4 py-2 block w-full rounded-md border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] h-11 text-sm text-gray-700 outline-none transition-all bg-gray-50/50 focus:bg-white"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={product?.Category_id || ""}
                className="px-4 py-2 block w-full rounded-md border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] h-11 text-sm text-gray-700 outline-none transition-all bg-gray-50/50 focus:bg-white"
                required
              >
                <option value="" disabled>
                  Select a Category
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
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  defaultValue={product?.unite_price || ""}
                  className="px-4 py-2 block w-full rounded-md border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] h-11 text-sm text-gray-700 outline-none transition-all bg-gray-50/50 focus:bg-white"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  defaultValue={product?.in_stock_vailable || ""}
                  className="px-4 py-2 block w-full rounded-md border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] h-11 text-sm text-gray-700 outline-none transition-all bg-gray-50/50 focus:bg-white"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="brand"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Brand
                </label>
                <select
                  id="brand"
                  name="brand"
                  defaultValue={product?.brand_id || ""}
                  className="px-4 py-2 block w-full rounded-md border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] h-11 text-sm text-gray-700 outline-none transition-all bg-gray-50/50 focus:bg-white"
                  required
                >
                  <option value="" disabled>
                    Select Brand
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
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={product?.description || ""}
                className="px-4 py-3 block w-full rounded-md border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] text-sm text-gray-700 outline-none transition-all bg-gray-50/50 focus:bg-white resize-none"
                placeholder="Product Description"
              />
            </div>
          </div>

          {/* Right Side: Image Upload */}
          <div className="w-full lg:w-1/3 flex flex-col">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Image
            </label>
            <div className="bg-gray-50/50 rounded-lg border border-dashed border-gray-200 p-4 h-full min-h-[300px] flex items-center justify-center">
              <ProductImageUpload
                key={product?.product_link}
                defaultValue={product?.product_link}
                name="productImage"
              />
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100 justify-end">
          <Link href="/product">
            <Button
              type="button"
              variant="ghost"
              className="px-8 h-11 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="px-8 h-11 bg-[#0B1DFF] text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
          >
            {product ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
