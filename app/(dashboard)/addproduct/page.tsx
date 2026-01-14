import React from "react";
import { Button } from "@/components/ui/button";

import { supabase } from "@/lib/supabaseClient";
import { addProduct } from "./actions";
import { ProductImageUpload } from "@/components/ProductImageUpload";

async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('categorie_id, categorie_name')
        .order('categorie_name');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return data || [];
}
async function getBrands() {
    const { data, error } = await supabase
        .from('brands')
        .select('brand_id, brand_name')
        .order('brand_name');

    if (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
    return data || [];
}

const AddProduct = async () => {
    const categories = await getCategories();
    const brands = await getBrands();

    return (
        <div className="p-10 w-[94%] mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Add new Products </h1>

            <form action={addProduct} className="bg-white p-8 rounded-lg shadow-md ">
                <div className="flex gap-30 w-[90%] ">
                    {/* Left Side - Form Fields */}
                    <div className="w-[40%]  mx-auto space-y-6 ">
                        <div>
                            <label htmlFor="product" className="block text-sm font-medium text-black-700 mb-2">
                                Product Name
                            </label>
                            <input
                                type="text"
                                id="product"
                                name="product"
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-[50px] text-gray-700 outline-none transition-colors"
                                placeholder="Product Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-black-700 mb-2">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-[50px] text-gray-700 outline-none transition-colors bg-white"
                                defaultValue=""
                            >
                                <option value="" disabled>Select a Category</option>
                                {categories.map((cat: any) => (
                                    <option key={cat.categorie_id} value={cat.categorie_id}>
                                        {cat.categorie_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-black-700 mb-2">
                                Price
                            </label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-[50px] text-gray-700 outline-none transition-colors"
                                placeholder="Price"
                            />
                        </div>
                        <div>
                            <label htmlFor="brand" className="block text-sm font-medium text-black-700 mb-2">
                                Brand
                            </label>
                            <select
                                id="brand"
                                name="brand"
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-[50px] text-gray-700 outline-none transition-colors bg-white"
                                defaultValue=""
                            >
                                <option value="" disabled>Select a Brand</option>
                                {brands.map((brand: any) => (
                                    <option key={brand.brand_id} value={brand.brand_id}>
                                        {brand.brand_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-black-700 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] text-gray-700 outline-none transition-colors resize-none"
                                placeholder="Product Description"
                            />
                        </div>
                    </div>

                    {/* Right Side - Image Upload */}
                    <div className="w-[30%] flex flex-col items-center">
                        <ProductImageUpload name="productImage" />
                    </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex gap-4 mt-2 pt-4 justify-center">
                    <Button type="button" variant="outline" className="w-[150px] h-[45px] border border-[#FF6B00]">
                        Cancel
                    </Button>
                    <Button type="submit" className="bg-[#0B1DFF] hover:bg-[#000ECC] w-[150px] h-[45px] text-white">
                        Add Product
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;

