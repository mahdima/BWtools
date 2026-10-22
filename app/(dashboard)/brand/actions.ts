'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/validation/form";
import { brandSchema } from "@/lib/validation/brand";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addBrand(formData: FormData) {
    await requireAdmin("admin");

    const parsed = parseForm(brandSchema, formData);
    if (!parsed.success) {
        throw new Error(parsed.message);
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
        throw new Error(`Failed to add brand: ${error.message}`);
    }

    revalidatePath("/brand");
    redirect("/brand");
}

export async function updateBrand(brandId: string, formData: FormData) {
    await requireAdmin("admin");

    const id = Number(brandId);
    if (!Number.isInteger(id)) {
        throw new Error("Brand not found");
    }

    const parsed = parseForm(brandSchema, formData);
    if (!parsed.success) {
        throw new Error(parsed.message);
    }
    const brand_name = parsed.data.brand;

    const { error } = await supabaseAdmin
        .from('brands')
        .update({ brand_name })
        .eq('brand_id', id);

    if (error) {
        console.error("Error updating brand:", error);
        throw new Error(`Failed to update brand: ${error.message}`);
    }

    revalidatePath("/brand");
    redirect("/brand");
}

export async function deleteBrand(brandId: string) {
    await requireAdmin("admin");

    if (!brandId) {
        throw new Error("Brand ID is required for deletion");
    }

    const { error } = await supabaseAdmin
        .from('brands')
        .delete()
        .eq('brand_id', parseInt(brandId));

    if (error) {
        console.error("Error deleting brand:", error);
        throw new Error(`Failed to delete brand: ${error.message}`);
    }

    revalidatePath("/brand");
}
