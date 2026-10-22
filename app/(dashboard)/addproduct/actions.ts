'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth";
import { imageExtension, parseForm } from "@/lib/validation/form";
import { productSchema } from "@/lib/validation/product";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Uploads a validated image to the `products` bucket and returns its public URL.
async function uploadProductImage(imageFile: File) {
    const filePath = `${Math.random().toString(36).substring(2)}.${imageExtension(imageFile)}`;

    const { error: uploadError } = await supabaseAdmin
        .storage
        .from('products')
        .upload(filePath, imageFile, { contentType: imageFile.type });

    if (uploadError) {
        console.error("Error uploading product image to 'products':", uploadError);
        throw new Error(`Failed to upload product image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('products')
        .getPublicUrl(filePath);

    return publicUrl;
}

function productListUrl(page: string | undefined) {
    const cursor = page ? `?page=${page}` : "";
    return `/product${cursor}${cursor ? "&" : "?"}toast=success`;
}

export async function addProduct(formData: FormData) {
    await requireAdmin("admin");

    const parsed = parseForm(productSchema, formData);
    if (!parsed.success) {
        throw new Error(parsed.message);
    }
    const input = parsed.data;

    const product_link = input.productImage ? await uploadProductImage(input.productImage) : null;

    const { error } = await supabaseAdmin
        .from('products')
        .insert([
            {
                product_name: input.product,
                Category_id: input.category,
                unite_price: input.price,
                brand_id: input.brand,
                description: input.description,
                product_link,
                in_stock_vailable: input.quantity,
            }
        ]);

    if (error) {
        console.error("Error inserting product:", error);
        throw new Error(`Failed to add product: ${error.message}`);
    }

    revalidatePath("/product");
    redirect(productListUrl(input.page));
}

export async function deleteProduct(productId: string) {
    await requireAdmin("admin");

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
    await requireAdmin("admin");

    const id = Number(productId);
    if (!Number.isInteger(id)) {
        throw new Error("Product not found");
    }

    const parsed = parseForm(productSchema, formData);
    if (!parsed.success) {
        throw new Error(parsed.message);
    }
    const input = parsed.data;

    // A new file replaces the image; otherwise keep the current URL (empty when removed)
    const product_link = input.productImage
        ? await uploadProductImage(input.productImage)
        : input.existingImageUrl || null;

    const { error } = await supabaseAdmin
        .from('products')
        .update({
            product_name: input.product,
            Category_id: input.category,
            unite_price: input.price,
            brand_id: input.brand,
            description: input.description,
            product_link,
            in_stock_vailable: input.quantity,
        })
        .eq('product_id', id);

    if (error) {
        console.error("Error updating product:", error);
        throw new Error(`Failed to update product: ${error.message}`);
    }

    revalidatePath("/product");
    redirect(productListUrl(input.page));
}
