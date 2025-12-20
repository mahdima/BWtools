import React from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { updateProduct } from "@/app/(dashboard)/addproduct/actions";
import { notFound } from "next/navigation";
import { ProductImageUpload } from "@/components/ProductImageUpload";

async function getProduct(id: string) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', parseInt(id))
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}

async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('categorie_id, categorie_name')
        .order('categorie_name');

    if (error) return [];
    return data || [];
}

async function getBrands() {
    const { data, error } = await supabase
        .from('brands')
        .select('brand_id, brand_name')
        .order('brand_name');

    if (error) return [];
    return data || [];
}

const EditProduct = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const productData = await getProduct(id);
    const categories = await getCategories();
    const brands = await getBrands();

    if (!productData) {
        notFound();
    }

    const updateProductWithId = updateProduct.bind(null, id);

    return (
        <div className="p-10 w-[94%] mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Edit Product: {productData.product_name}</h1>

            <form action={updateProductWithId} className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex gap-10 w-[90%] mx-auto">
                    {/* Left Side - Form Fields */}
                    <div className="w-[50%] space-y-6">
                        <div>
                            <label htmlFor="product" className="block text-sm font-medium text-black-700 mb-2">
                                Product Name
                            </label>
                            <input
                                type="text"
                                id="product"
                                name="product"
                                defaultValue={productData.product_name}
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-[50px] text-gray-700 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-black-700 mb-2">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                defaultValue={productData.Category_id}
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-[50px] text-gray-700 outline-none transition-colors bg-white"
                            >
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
                                step="0.01"
                                defaultValue={productData.unite_price}
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-[50px] text-gray-700 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="brand" className="block text-sm font-medium text-black-700 mb-2">
                                Brand
                            </label>
                            <select
                                id="brand"
                                name="brand"
                                defaultValue={productData.brand_id}
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-[50px] text-gray-700 outline-none transition-colors bg-white"
                            >
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
                                defaultValue={productData.description}
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] text-gray-700 outline-none transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {/* Right Side - Image Upload */}
                    <div className="w-[40%] flex flex-col items-center">
                        <ProductImageUpload
                            defaultValue={productData.product_link}
                            name="productImage"
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-8 pt-4 justify-center">
                    <Button type="button" variant="outline" className="w-[150px] h-[45px] border border-[#FF6B00] text-[#FF6B00]">
                        Cancel
                    </Button>
                    <Button type="submit" className="bg-[#0B1DFF] hover:bg-[#000ECC] w-[150px] h-[45px] text-white">
                        Update Product
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditProduct;
