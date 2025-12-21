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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <form action={action} className="bg-white rounded-lg">
        <div className="flex gap-10 w-full mx-auto">
          {/* Left Side - Form Fields */}
          <div className="w-[60%] space-y-6">
            <div>
              <label
                htmlFor="product"
                className="block text-sm font-medium text-black-700 mb-2"
              >
                Product Name
              </label>
              <input
                type="text"
                id="product"
                name="product"
                defaultValue={product?.product_name || ""}
                className="px-3 py-2 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-10 text-sm text-gray-700 outline-none transition-colors"
                placeholder="Product Name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-black-700 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={product?.Category_id || ""}
                className="px-3 py-2 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-10 text-sm text-gray-700 outline-none transition-colors bg-white"
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

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-black-700 mb-2"
              >
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                defaultValue={product?.unite_price || ""}
                className="px-3 py-2 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-10 text-sm text-gray-700 outline-none transition-colors"
                placeholder="Price"
                step="0.01"
                required
              />
            </div>
            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-black-700 mb-2"
              >
                Brand
              </label>
              <select
                id="brand"
                name="brand"
                defaultValue={product?.brand_id || ""}
                className="px-3 py-2 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-10 text-sm text-gray-700 outline-none transition-colors bg-white"
                required
              >
                <option value="" disabled>
                  Select a Brand
                </option>
                {brands.map((brand: any) => (
                  <option key={brand.brand_id} value={brand.brand_id}>
                    {brand.brand_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-black-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={product?.description || ""}
                className="px-3 py-2 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] text-sm text-gray-700 outline-none transition-colors resize-none"
                placeholder="Product Description"
              />
            </div>
          </div>

          {/* Right Side - Image Upload */}
          <div className="w-[40%] flex flex-col items-center">
            <ProductImageUpload
              key={product?.product_link}
              defaultValue={product?.product_link}
              name="productImage"
            />
            {/* Debug: Check if URL exists */}
            {/* <p className="text-xs text-gray-400 mt-2 break-all">{product?.product_link || "No image URL found"}</p> */}
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-4 mt-8 pt-4 justify-center">
          <Link href="/product">
            <Button
              type="button"
              variant="outline"
              className="w-[150px] h-[45px] border border-[#FF6B00] text-[#FF6B00]"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-white text-[#0B1DFF] border border-[#0B1DFF] hover:bg-blue-50 w-[150px] h-[45px]"
          >
            {product ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
