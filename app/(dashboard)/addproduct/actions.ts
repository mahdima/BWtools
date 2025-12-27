'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addProduct(formData: FormData) {
    const product_name = formData.get("product")?.toString();
    const Category_id = formData.get("category")?.toString();
    const unite_price = formData.get("price")?.toString();
    const brand_id = formData.get("brand")?.toString();
    const description = formData.get("description")?.toString();
    const quantity = formData.get("quantity")?.toString();

    if (!product_name || !Category_id || !unite_price || !brand_id || !quantity) {
        throw new Error("Missing required fields");
    }

    const imageFile = formData.get("productImage") as File | null;
    let product_link = null;

    if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log(`Uploading product image ${imageFile.name} to 'products' bucket...`);

        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('products')
            .upload(filePath, imageFile);

        if (uploadError) {
            console.error("Error uploading product image to 'products':", uploadError);
            throw new Error(`Failed to upload product image: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('products')
            .getPublicUrl(filePath);

        product_link = publicUrl;
        console.log("Product image uploaded successfully, URL:", product_link);
    }

    const { data, error } = await supabaseAdmin
        .from('products')
        .insert([
            {
                product_name,
                Category_id: parseInt(Category_id),
                unite_price: parseFloat(unite_price),
                brand_id: parseInt(brand_id),
                description,
                product_link,
                in_stock_vailable: parseInt(quantity)
            }
        ])
        .select();

    if (error) {
        console.error("Error inserting product:", error);
        throw new Error(`Failed to add product: ${error.message}`);
    }

    revalidatePath("/product");
    redirect("/product");

}

export async function deleteProduct(productId: string) {
    if (!productId) {
        throw new Error("Product ID is required for deletion");
    }

    const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('product_id', parseInt(productId));

    if (error) {
        console.error("Error deleting product:", error);
        throw new Error(`Failed to delete product: ${error.message}`);
    }

    revalidatePath("/product");
}

export async function updateProduct(productId: string, formData: FormData) {
    const product_name = formData.get("product")?.toString();
    const Category_id = formData.get("category")?.toString();
    const unite_price = formData.get("price")?.toString();
    const brand_id = formData.get("brand")?.toString();
    const description = formData.get("description")?.toString();
    const quantity = formData.get("quantity")?.toString();

    if (!productId || !product_name || !Category_id || !unite_price || !brand_id || !quantity) {
        throw new Error("Missing required fields");
    }

    const imageFile = formData.get("productImage") as File | null;
    let product_link = formData.get("existingImageUrl")?.toString() || null;

    if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log(`Updating product image for product ${productId}...`);

        const { error: uploadError } = await supabaseAdmin
            .storage
            .from('products')
            .upload(filePath, imageFile);

        if (uploadError) {
            console.error("Error uploading product image to 'products':", uploadError);
            throw new Error(`Failed to upload product image: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('products')
            .getPublicUrl(filePath);

        product_link = publicUrl;
        console.log("Product image updated successfully, URL:", product_link);
    } else {
        console.log("No new image file provided, using product_link:", product_link);
    }

    const { error } = await supabaseAdmin
        .from('products')
        .update({
            product_name,
            Category_id: parseInt(Category_id),
            unite_price: parseFloat(unite_price),
            brand_id: parseInt(brand_id),
            description,
            product_link,
            in_stock_vailable: parseInt(quantity)
        })
        .eq('product_id', parseInt(productId));

    console.log("Update query executed for ID:", productId, "with product_link:", product_link);

    if (error) {
        console.error("Error updating product:", error);
        throw new Error(`Failed to update product: ${error.message}`);
    }

    revalidatePath("/product");
    redirect("/product");
}
