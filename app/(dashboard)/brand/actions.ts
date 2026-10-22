'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { NOT_AUTHORIZED, isForeignKeyViolation, type ActionResult } from "@/lib/action-result";
import { parseForm } from "@/lib/validation/form";
import { brandSchema } from "@/lib/validation/brand";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Form action (via useFormAction): returns an error to show, or redirects on success.
export async function addBrand(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
    if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

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

    revalidatePath("/brand");
    redirect("/brand");
}

// Form action bound to a brand id (via useFormAction): returns an error or redirects.
export async function updateBrand(
    brandId: string,
    _prevState: ActionResult | null,
    formData: FormData,
): Promise<ActionResult> {
    if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

    const id = Number(brandId);
    if (!Number.isInteger(id)) {
        return { success: false, message: "Brand not found." };
    }

    const parsed = parseForm(brandSchema, formData);
    if (!parsed.success) {
        return { success: false, message: parsed.message };
    }
    const brand_name = parsed.data.brand;

    const { error } = await supabaseAdmin
        .from('brands')
        .update({ brand_name })
        .eq('brand_id', id);

    if (error) {
        console.error("Error updating brand:", error);
        return { success: false, message: `Failed to update brand: ${error.message}` };
    }

    revalidatePath("/brand");
    redirect("/brand");
}

export async function deleteBrand(brandId: string): Promise<ActionResult> {
    if (!(await getAuthorizedAdmin("admin"))) return NOT_AUTHORIZED;

    const id = Number(brandId);
    if (!Number.isInteger(id)) {
        return { success: false, message: "Brand not found." };
    }

    const { data, error } = await supabaseAdmin
        .from('brands')
        .delete()
        .eq('brand_id', id)
        .select('brand_id');

    if (error) {
        console.error("Error deleting brand:", error);
        return {
            success: false,
            message: isForeignKeyViolation(error)
                ? "This brand still has products. Move or delete them first."
                : `Failed to delete brand: ${error.message}`,
        };
    }

    if (!data?.length) {
        return { success: false, message: "Brand not found." };
    }

    revalidatePath("/brand");
    return { success: true, message: "Brand deleted." };
}
