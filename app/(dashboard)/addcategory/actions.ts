'use server'

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth";
import { imageExtension, parseForm } from "@/lib/validation/form";
import { categorySchema } from "@/lib/validation/category";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addCategory(formData: FormData) {
    await requireAdmin("admin");

    try {
        const parsed = parseForm(categorySchema, formData);
        if (!parsed.success) {
            throw new Error(parsed.message);
        }
        const categorie_name = parsed.data.categoryName;
        const imageFile = parsed.data.categoryImage;
        let cat_image_url = null;

        if (imageFile) {
            const fileExt = imageExtension(imageFile);
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            console.log(`Checking bucket 'StaticAssests'...`);
            const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
            if (bucketError) {
                console.error("Error listing buckets:", bucketError);
            } else {
                const availableNames = buckets?.map(b => b.name) || [];
                console.log("Available buckets:", availableNames);
                if (!availableNames.includes('StaticAssests')) {
                    console.error("CRITICAL: Bucket 'StaticAssests' not found in project!");
                    throw new Error(`Bucket 'StaticAssests' not found. Available: ${availableNames.join(', ')}`);
                }
            }

            console.log(`Uploading ${imageFile.name} to StaticAssests...`);
            const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from('StaticAssests')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error("Error uploading image to StaticAssests:", uploadError);
                throw new Error(`Failed to upload to StaticAssests: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabaseAdmin
                .storage
                .from('StaticAssests')
                .getPublicUrl(filePath);

            cat_image_url = publicUrl;
            console.log("Image uploaded successfully, URL:", cat_image_url);
        }

        console.log(`Inserting category ${categorie_name} into database...`);

        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert([
                {
                    categorie_name,
                    cat_image_url,
                }
            ])
            .select();

        if (error) {
            console.error("Error inserting category into database:", error);
            throw new Error(`Failed to add category to database: ${error.message} (Code: ${error.code})`);
        }

        console.log("Category added successfully:", data);

        revalidatePath("/categories");
    } catch (err: any) {
        console.error("CRITICAL ERROR in addCategory:", err);
        throw err; // Re-throw so Next.js handles it or shows it in logs
    }

    // Redirect must be outside try-catch to avoid catching the redirect error
    redirect("/categories");
}

export async function deleteCategory(categoryId: string) {
    await requireAdmin("admin");

    if (!categoryId) {
        throw new Error("Category ID is required for deletion");
    }

    const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('categorie_id', parseInt(categoryId));

    if (error) {
        console.error("Error deleting category:", error);
        throw new Error(`Failed to delete category: ${error.message}`);
    }

    revalidatePath("/categories");
}

export async function updateCategory(categoryId: string, formData: FormData) {
    await requireAdmin("admin");

    try {
        const parsed = parseForm(categorySchema, formData);
        if (!categoryId || !parsed.success) {
            throw new Error(parsed.success ? "Category not found" : parsed.message);
        }
        const categorie_name = parsed.data.categoryName;
        const imageFile = parsed.data.categoryImage;
        let cat_image_url = formData.get("existingImageUrl")?.toString() || null;

        if (imageFile) {
            const fileExt = imageExtension(imageFile);
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            console.log(`Checking bucket 'StaticAssests'...`);
            const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
            if (bucketError) {
                console.error("Error listing buckets:", bucketError);
            } else {
                const availableNames = buckets?.map(b => b.name) || [];
                console.log("Available buckets:", availableNames);
                if (!availableNames.includes('StaticAssests')) {
                    console.error("CRITICAL: Bucket 'StaticAssests' not found in project!");
                    throw new Error(`Bucket 'StaticAssests' not found. Available: ${availableNames.join(', ')}`);
                }
            }

            console.log(`Uploading ${imageFile.name} to StaticAssests...`);
            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('StaticAssests')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error("Error uploading image to StaticAssests:", uploadError);
                throw new Error(`Failed to upload to StaticAssests: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabaseAdmin
                .storage
                .from('StaticAssests')
                .getPublicUrl(filePath);

            cat_image_url = publicUrl;
            console.log("Image updated successfully, URL:", cat_image_url);
        }

        console.log(`Updating category ${categoryId} in database...`);

        const { error } = await supabaseAdmin
            .from('categories')
            .update({
                categorie_name,
                cat_image_url
            })
            .eq('categorie_id', parseInt(categoryId));

        if (error) {
            console.error("Error updating category in database:", error);
            throw new Error(`Failed to update category in database: ${error.message} (Code: ${error.code})`);
        }

        console.log(`Category ${categoryId} updated successfully.`);

        revalidatePath("/categories");
    } catch (err) {
        console.error("CRITICAL ERROR in updateCategory:", err);
        throw err;
    }
    redirect("/categories");
}
