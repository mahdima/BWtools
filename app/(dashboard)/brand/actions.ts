'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { NOT_AUTHORIZED, isForeignKeyViolation, type ActionResult } from "@/lib/action-result";
import { parseForm } from "@/lib/validation/form";
import { brandSchema } from "@/lib/validation/brand";
import { archiveResult, hasActiveProducts, setArchived } from "@/lib/archive";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Form action (via useFormAction): returns an error to show, or redirects on success.
export async function addBrand(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return NOT_AUTHORIZED;

    const parsed = parseForm(brandSchema, formData);
    if (!parsed.success) {
        return { success: false, message: parsed.message };
    }
    const brand_name = parsed.data.brand;

    // Fetch the current max brand_id
    const { data: maxBrand } = await supabaseAdmin
        .from('brands')
        .select('brand_id')
        .order('brand_id', { ascending: false })
        .limit(1)
        .single();

    const nextId = (maxBrand?.brand_id || 0) + 1;

    const { error } = await supabaseAdmin
        .from('brands')
        .insert([{ brand_id: nextId, brand_name }])
        .select();

    if (error) {
        console.error("Error inserting brand:", error);
        return { success: false, message: `Failed to add brand: ${error.message}` };
    }

    logAudit(admin.id, "create", "brand", nextId, { brand_name });
    revalidatePath("/brand");
    redirect("/brand");
}

// Form action bound to a brand id (via useFormAction): returns an error or redirects.
export async function updateBrand(
    brandId: string,
    _prevState: ActionResult | null,
    formData: FormData,
): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return NOT_AUTHORIZED;

    const id = Number(brandId);
    if (!Number.isInteger(id)) {
        return { success: false, message: "Brand not found." };
    }

    const parsed = parseForm(brandSchema, formData);
    if (!parsed.success) {
        return { success: false, message: parsed.message };
    }
    const brand_name = parsed.data.brand;

    // The update returns the new name only, so read the old one for the audit log
    const { data: current } = await supabaseAdmin
        .from('brands')
        .select('brand_name')
        .eq('brand_id', id)
        .maybeSingle();

    if (!current) {
        return { success: false, message: "Brand not found." };
    }

    const { error } = await supabaseAdmin
        .from('brands')
        .update({ brand_name })
        .eq('brand_id', id);

    if (error) {
        console.error("Error updating brand:", error);
        return { success: false, message: `Failed to update brand: ${error.message}` };
    }

    if (current.brand_name !== brand_name) {
        logAudit(admin.id, "update", "brand", id, { brand_name: { from: current.brand_name, to: brand_name } });
    }
    revalidatePath("/brand");
    redirect("/brand");
}

export async function deleteBrand(brandId: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return NOT_AUTHORIZED;

    const id = Number(brandId);
    if (!Number.isInteger(id)) {
        return { success: false, message: "Brand not found." };
    }

    const { data, error } = await supabaseAdmin
        .from('brands')
        .delete()
        .eq('brand_id', id)
        .select('brand_id, brand_name');

    if (error) {
        if (!isForeignKeyViolation(error)) {
            console.error("Error deleting brand:", error);
            return { success: false, message: `Failed to delete brand: ${error.message}` };
        }

        // Products still point to it. If they're all archived, archive the brand too (P6-08)
        const stillHasProducts = "This brand still has products. Move or delete them first.";
        if ((await hasActiveProducts("brand_id", id)) !== false) return { success: false, message: stillHasProducts };

        const result = archiveResult(await setArchived("brands", id, true), {
            done: "This brand is used by archived products, so it was archived instead of deleted.",
            notFound: "Brand not found.",
            unavailable: stillHasProducts,
            failed: "Failed to archive brand",
        });
        if (result.success) {
            logAudit(admin.id, "archive", "brand", id);
            revalidatePath("/brand");
        }
        return result;
    }

    if (!data?.length) {
        return { success: false, message: "Brand not found." };
    }

    logAudit(admin.id, "delete", "brand", id, { brand_name: data[0].brand_name });
    revalidatePath("/brand");
    return { success: true, message: "Brand deleted." };
}

export async function restoreBrand(brandId: string): Promise<ActionResult> {
    const admin = await getAuthorizedAdmin("admin");
    if (!admin) return NOT_AUTHORIZED;

    const id = Number(brandId);
    if (!Number.isInteger(id)) {
        return { success: false, message: "Brand not found." };
    }

    const result = archiveResult(await setArchived("brands", id, false), {
        done: "Brand restored.",
        notFound: "Brand not found.",
        unavailable: "Archiving isn't set up yet.",
        failed: "Failed to restore brand",
    });
    if (result.success) {
        logAudit(admin.id, "restore", "brand", id);
        revalidatePath("/brand");
    }
    return result;
}
