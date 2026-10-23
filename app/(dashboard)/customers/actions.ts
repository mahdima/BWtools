"use server";

import { getTranslations } from "next-intl/server";
import { notAuthorized, parseFormT } from "@/lib/server-messages";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthorizedAdmin } from "@/lib/auth";
import { customerSchema } from "@/lib/validation/customer";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function updateCustomer(formData: FormData) {
  const admin = await getAuthorizedAdmin("admin");
  if (!admin) return notAuthorized();
  const t = await getTranslations("actions.customers");

  const parsed = await parseFormT(customerSchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { id, username, phone } = parsed.data;

  // 1. Update Username in Profiles (if username is changed)
  // We use the regular client for this table update (assuming RLS allows it or we use admin if needed)
  // Usage of admin for profiles is safer if RLS is strict for other users editing.
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      username: username || null,
    })
    .eq("id", id);

  if (profileError) {
    // If phone didn't fail but profile did, we still report error.
    return { success: false, message: t("updateProfileFailed", { error: profileError.message }) };
  }

  // 2. Update Phone in Auth Users (admin only)
  if (phone) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { phone: phone }
    );

    if (authError) {
      return { success: false, message: t("updatePhoneFailed", { error: authError.message }) };
    }
  }

  // Customer details are personal data: log which fields were saved, not their values
  logAudit(admin.id, "update", "customer", id, { fields: phone ? ["username", "phone"] : ["username"] });
  revalidatePath("/customers");
  return { success: true, message: t("updated") };
}
