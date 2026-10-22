'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { NOT_AUTHORIZED, isForeignKeyViolation, type ActionResult } from "@/lib/action-result";
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

// Form action (via useFormAction): returns an error to show, or redirects on success.
export async function addProduct(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
    if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

    const parsed = parseForm(productSchema, formData);
    if (!parsed.success) {
        return { success: false, message: parsed.message };
    }
    const input = parsed.data;

    let product_link: string | null = null;
    if (input.productImage) {
        try {
            product_link = await uploadProductImage(input.productImage);
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

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
        return { success: false, message: `Failed to add product: ${error.message}` };
    }

    revalidatePath("/product");
    redirect(productListUrl(input.page));
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
    if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

    const id = Number(productId);
    if (!Number.isInteger(id)) {
        return { success: false, message: "Product not found." };
    }

    const { data, error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('product_id', id)
        .select('product_id');

    if (error) {
        console.error("Error deleting product:", error);
        return {
            success: false,
            message: isForeignKeyViolation(error)
                ? "This product appears in existing orders or favorites, so it can't be deleted."
                : `Failed to delete product: ${error.message}`,
        };
    }

    if (!data?.length) {
        return { success: false, message: "Product not found." };
    }

    revalidatePath("/product");
    return { success: true, message: "Product deleted." };
}

// Form action bound to a product id (via useFormAction): returns an error or redirects.
export async function updateProduct(
    productId: string,
    _prevState: ActionResult | null,
    formData: FormData,
): Promise<ActionResult> {
    if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

    const id = Number(productId);
    if (!Number.isInteger(id)) {
        return { success: false, message: "Product not found." };
    }

    const parsed = parseForm(productSchema, formData);
    if (!parsed.success) {
        return { success: false, message: parsed.message };
    }
    const input = parsed.data;

    // A new file replaces the image; otherwise keep the current URL (empty when removed)
    let product_link = input.existingImageUrl || null;
    if (input.productImage) {
        try {
            product_link = await uploadProductImage(input.productImage);
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

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
        return { success: false, message: `Failed to update product: ${error.message}` };
    }

    revalidatePath("/product");
    redirect(productListUrl(input.page));
}
