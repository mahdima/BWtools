'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { NOT_AUTHORIZED, isForeignKeyViolation, type ActionResult } from "@/lib/action-result";
import { parseForm } from "@/lib/validation/form";
import { productSchema } from "@/lib/validation/product";
import { removeUnusedImage, uploadImage } from "@/lib/image-storage";
import { PRODUCT_IMAGES } from "@/lib/storage-path";
import { archiveResult, setArchived } from "@/lib/archive";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

function productListUrl(page: string | undefined) {
    const cursor = page ? `?page=${page}` : "";
    return `/product${cursor}${cursor ? "&" : "?"}toast=success`;
}

// Deletes a product image that's no longer used, after the response is sent.
function cleanUpImage(url: string | null | undefined) {
    after(() => removeUnusedImage(PRODUCT_IMAGES, url));
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
            product_link = await uploadImage(PRODUCT_IMAGES, input.productImage);
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
        cleanUpImage(product_link); // the upload belongs to no product
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
        .select('product_id, product_link');

    if (error) {
        if (isForeignKeyViolation(error)) {
            // Orders, favorites or saved orders still use it: archive it instead (P6-08)
            const result = archiveResult(await setArchived("products", id, true), {
                done: "This product is used by orders or favorites, so it was archived instead of deleted.",
                notFound: "Product not found.",
                unavailable: "This product appears in existing orders or favorites, so it can't be deleted.",
                failed: "Failed to archive product",
            });
            if (result.success) revalidatePath("/product");
            return result;
        }
        console.error("Error deleting product:", error);
        return { success: false, message: `Failed to delete product: ${error.message}` };
    }

    if (!data?.length) {
        return { success: false, message: "Product not found." };
    }

    cleanUpImage(data[0].product_link);
    revalidatePath("/product");
    return { success: true, message: "Product deleted." };
}

export async function restoreProduct(productId: string): Promise<ActionResult> {
    if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

    const id = Number(productId);
    if (!Number.isInteger(id)) {
        return { success: false, message: "Product not found." };
    }

    const result = archiveResult(await setArchived("products", id, false), {
        done: "Product restored.",
        notFound: "Product not found.",
        unavailable: "Archiving isn't set up yet.",
        failed: "Failed to restore product",
    });
    if (result.success) revalidatePath("/product");
    return result;
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

    const { data: current, error: readError } = await supabaseAdmin
        .from('products')
        .select('product_link')
        .eq('product_id', id)
        .maybeSingle();

    if (readError) {
        console.error("Error reading product:", readError);
        return { success: false, message: `Failed to update product: ${readError.message}` };
    }
    if (!current) {
        return { success: false, message: "Product not found." };
    }

    // A new file replaces the image. Otherwise the form's existingImageUrl says whether
    // to keep the current one (empty = removed); the URL itself comes from the database.
    let product_link = input.existingImageUrl ? current.product_link : null;
    if (input.productImage) {
        try {
            product_link = await uploadImage(PRODUCT_IMAGES, input.productImage);
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
        if (input.productImage) cleanUpImage(product_link); // the new upload wasn't saved
        return { success: false, message: `Failed to update product: ${error.message}` };
    }

    if (current.product_link !== product_link) cleanUpImage(current.product_link);
    revalidatePath("/product");
    redirect(productListUrl(input.page));
}
