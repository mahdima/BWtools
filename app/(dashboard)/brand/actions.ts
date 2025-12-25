'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache"; 
import { redirect } from "next/navigation";

export async function addBrand(formData: FormData) {
    const brand_name = formData.get("brand")?.toString();

    if (!brand_name) {
        throw new Error("Brand name is required");
    }

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
    const brand_name = formData.get("brand")?.toString();

    if (!brandId || !brand_name) {
        throw new Error("Missing required fields");
    }

    const { error } = await supabaseAdmin
        .from('brands')
        .update({ brand_name })
        .eq('brand_id', parseInt(brandId));

    if (error) {
        console.error("Error updating brand:", error);
        throw new Error(`Failed to update brand: ${error.message}`);
    }

    revalidatePath("/brand");
    redirect("/brand");
}

export async function deleteBrand(brandId: string) {
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
