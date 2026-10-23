'use server'

import { getTranslations } from "next-intl/server";
import { getBulkWords, getValidationText, notAuthorized, parseFormT, uploadFailed } from "@/lib/server-messages";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { isForeignKeyViolation, type ActionResult } from "@/lib/action-result";
import { productSchema } from "@/lib/validation/product";
import { removeUnusedImage, uploadImage } from "@/lib/image-storage";
import { PRODUCT_IMAGES } from "@/lib/storage-path";
import { archiveResult, setArchived } from "@/lib/archive";
import { logAudit } from "@/lib/audit";
import { diffChanges } from "@/lib/audit-changes";
import { MAX_BULK, bulkResult, parseBulkIds } from "@/lib/bulk";
import { getProductFormOptions, getProductNames } from "@/lib/data/products";
import { normalizeName, readProductImport, type ImportLookup, type ImportRow } from "@/lib/product-import";
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
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.products");

    const parsed = await parseFormT(productSchema, formData);
    if (!parsed.success) {
        return { success: false, message: parsed.message };
    }
    const input = parsed.data;

    let product_link: string | null = null;
    if (input.productImage) {
        try {
            product_link = await uploadImage(PRODUCT_IMAGES, input.productImage);
        } catch (error) {
            return uploadFailed(error);
        }
    }

    const values = {
        product_name: input.product,
        Category_id: input.category,
        unite_price: input.price,
        brand_id: input.brand,
        description: input.description,
        product_link,
        in_stock_vailable: input.quantity,
    };

    const { data: created, error } = await supabaseAdmin
        .from('products')
        .insert([values])
        .select('product_id')
        .single();

    if (error) {
        console.error("Error inserting product:", error);
        cleanUpImage(product_link); // the upload belongs to no product
        return { success: false, message: t("addFailed", { error: error.message }) };
    }

    logAudit(admin.id, "create", "product", created.product_id, {
        product_name: values.product_name,
        unite_price: values.unite_price,
        in_stock_vailable: values.in_stock_vailable,
    });
    revalidatePath("/product");
    redirect(productListUrl(input.page));
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.products");

    const id = Number(productId);
    if (!Number.isInteger(id)) {
        return { success: false, message: t("notFound") };
    }

    const result = await removeProduct(admin.id, id);
    if (result.outcome === "failed") return { success: false, message: result.message };

    revalidatePath("/product");
    return {
        success: true,
        message: result.outcome === "deleted" ? t("deleted") : t("archivedInstead"),
    };
}

// Deletes one product, or archives it when orders, favorites or saved orders still
// use it (P6-08). Shared by the row action and the bulk action.
async function removeProduct(
    adminId: string,
    id: number,
): Promise<{ outcome: "deleted" } | { outcome: "archived" } | { outcome: "failed"; message: string }> {
    const t = await getTranslations("actions.products");
    const { data, error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('product_id', id)
        .select('product_id, product_name, product_link');

    if (error) {
        if (!isForeignKeyViolation(error)) {
            console.error("Error deleting product:", error);
            return { outcome: "failed", message: t("deleteFailed", { error: error.message }) };
        }

        const archived = await setArchived("products", id, true);
        if (archived.status === "done") {
            logAudit(adminId, "archive", "product", id);
            return { outcome: "archived" };
        }
        const { message } = archiveResult(archived, {
            done: "",
            notFound: t("notFound"),
            unavailable: t("inUse"),
            failed: (error) => t("archiveFailed", { error }),
        });
        return { outcome: "failed", message };
    }

    if (!data?.length) {
        return { outcome: "failed", message: t("notFound") };
    }

    cleanUpImage(data[0].product_link);
    logAudit(adminId, "delete", "product", id, { product_name: data[0].product_name });
    return { outcome: "deleted" };
}

// Bulk delete (P7-03): each product is deleted, or archived when it's still used.
export async function deleteProducts(productIds: string[]): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.products");

    const ids = parseBulkIds(productIds);
    if (!ids) return { success: false, message: t("selectBetween", { max: MAX_BULK }) };

    let deleted = 0;
    let archived = 0;
    const failures: string[] = [];
    // One at a time: each delete may fall back to archiving
    for (const id of ids) {
        const result = await removeProduct(admin.id, id);
        if (result.outcome === "deleted") deleted++;
        else if (result.outcome === "archived") archived++;
        else failures.push(`#${id}: ${result.message}`);
    }

    if (deleted || archived) revalidatePath("/product");
    return bulkResult(
        [
            deleted ? t("deletedCount", { count: deleted }) : "",
            archived ? t("archivedCount", { count: archived }) : "",
        ].filter(Boolean),
        failures,
        await getBulkWords(),
    );
}

export async function restoreProduct(productId: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.products");

    const id = Number(productId);
    if (!Number.isInteger(id)) {
        return { success: false, message: t("notFound") };
    }

    const result = archiveResult(await setArchived("products", id, false), await restoreMessages());
    if (result.success) {
        logAudit(admin.id, "restore", "product", id);
        revalidatePath("/product");
    }
    return result;
}

async function restoreMessages() {
    const [t, tc] = await Promise.all([getTranslations("actions.products"), getTranslations("actions.common")]);
    return {
        done: t("restored"),
        notFound: t("notFound"),
        unavailable: tc("archivingUnavailable"),
        failed: (error: string) => t("restoreFailed", { error }),
    };
}

// Bulk restore from the Archived view (P7-03).
export async function restoreProducts(productIds: string[]): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.products");

    const ids = parseBulkIds(productIds);
    if (!ids) return { success: false, message: t("selectBetween", { max: MAX_BULK }) };

    let restored = 0;
    const failures: string[] = [];
    for (const id of ids) {
        const result = archiveResult(await setArchived("products", id, false), await restoreMessages());
        if (result.success) {
            restored++;
            logAudit(admin.id, "restore", "product", id);
        } else {
            failures.push(`#${id}: ${result.message}`);
        }
    }

    if (restored) revalidatePath("/product");
    return bulkResult(restored ? [t("restoredCount", { count: restored })] : [], failures, await getBulkWords());
}

// Form action bound to a product id (via useFormAction): returns an error or redirects.
export async function updateProduct(
    productId: string,
    _prevState: ActionResult | null,
    formData: FormData,
): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.products");

    const id = Number(productId);
    if (!Number.isInteger(id)) {
        return { success: false, message: t("notFound") };
    }

    const parsed = await parseFormT(productSchema, formData);
    if (!parsed.success) {
        return { success: false, message: parsed.message };
    }
    const input = parsed.data;

    // The whole row: its image URL, and the "before" values for the audit log
    const { data: current, error: readError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('product_id', id)
        .maybeSingle();

    if (readError) {
        console.error("Error reading product:", readError);
        return { success: false, message: t("updateFailed", { error: readError.message }) };
    }
    if (!current) {
        return { success: false, message: t("notFound") };
    }

    // A new file replaces the image. Otherwise the form's existingImageUrl says whether
    // to keep the current one (empty = removed); the URL itself comes from the database.
    let product_link = input.existingImageUrl ? current.product_link : null;
    if (input.productImage) {
        try {
            product_link = await uploadImage(PRODUCT_IMAGES, input.productImage);
        } catch (error) {
            return uploadFailed(error);
        }
    }

    const values = {
        product_name: input.product,
        Category_id: input.category,
        unite_price: input.price,
        brand_id: input.brand,
        description: input.description,
        product_link,
        in_stock_vailable: input.quantity,
    };

    const { error } = await supabaseAdmin
        .from('products')
        .update(values)
        .eq('product_id', id);

    if (error) {
        console.error("Error updating product:", error);
        if (input.productImage) cleanUpImage(product_link); // the new upload wasn't saved
        return { success: false, message: t("updateFailed", { error: error.message }) };
    }

    if (current.product_link !== product_link) cleanUpImage(current.product_link);
    logAudit(admin.id, "update", "product", id, diffChanges(current, values));
    revalidatePath("/product");
    redirect(productListUrl(input.page));
}

// One checked row of a CSV import, as the preview shows it (P7-03).
export type ImportPreviewRow = Omit<ImportRow, "values" | "errors"> & { errors: string[] };
export type ImportPreviewResult = ActionResult & { rows?: ImportPreviewRow[]; validCount?: number };

// Categories and brands an import may use (active ones), and the names already taken.
async function importLookup(): Promise<ImportLookup> {
    const [{ categories, brands }, names] = await Promise.all([getProductFormOptions(), getProductNames()]);
    return { categories, brands, existingNames: new Set(names.map(normalizeName)) };
}

// Checks a products CSV without saving anything, for the preview step.
export async function previewProductImport(csv: string): Promise<ImportPreviewResult> {
    if (!(await getAuthorizedAdmin("admin"))) return notAuthorized();
    const t = await getTranslations("actions.products");
    if (typeof csv !== "string") return { success: false, message: t("chooseCsv") };

    const text = await getValidationText();
    const { error, rows } = readProductImport(csv, await importLookup());
    if (error) return { success: false, message: text(error) };

    const validCount = rows.filter((row) => row.values).length;
    return {
        success: true,
        message: t("previewSummary", { valid: validCount, total: rows.length }),
        rows: rows.map(({ row, name, category, brand, price, quantity, errors }) => ({
            row, name, category, brand, price, quantity, errors: errors.map(text),
        })),
        validCount,
    };
}

// Imports the valid rows of a products CSV. The file is checked again here: the
// preview is only for the admin, never trusted.
export async function importProducts(csv: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return notAuthorized();
    const t = await getTranslations("actions.products");
    if (typeof csv !== "string") return { success: false, message: t("chooseCsv") };

    const { error, rows } = readProductImport(csv, await importLookup());
    if (error) return { success: false, message: (await getValidationText())(error) };

    const values = rows.flatMap((row) => (row.values ? [row.values] : []));
    if (values.length === 0) return { success: false, message: t("nothingToImport") };

    // One insert: either every valid row is saved or none is
    const { error: insertError } = await supabaseAdmin.from('products').insert(values);
    if (insertError) {
        console.error("Error importing products:", insertError);
        return { success: false, message: t("importFailed", { error: insertError.message }) };
    }

    const skipped = rows.length - values.length;
    logAudit(admin.id, "import", "product", null, { rows: values.length, skipped });
    revalidatePath("/product");
    return {
        success: true,
        message: t("imported", { count: values.length, skipped }),
    };
}
