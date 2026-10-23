"use server";

import { getTranslations } from "next-intl/server";
import { notAuthorized, parseFormT } from "@/lib/server-messages";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentAdmin } from "@/lib/auth";
import { profileSchema } from "@/lib/validation/admin";
import { logAudit } from "@/lib/audit";
import { diffChanges } from "@/lib/audit-changes";
import { revalidatePath } from "next/cache";

export async function updateAdminProfile(prevState: any, formData: FormData) {
  const admin = await getCurrentAdmin();

  if (!admin) return notAuthorized();
  const t = await getTranslations("actions.profile");

  const parsed = await parseFormT(profileSchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { fullName, email } = parsed.data;

  // 1. Update the admin's own row. The id comes from the session, never from the form,
  // and role / active status are only changed by super admins on the Team page.
  const { error: profileError } = await supabaseAdmin
    .from("admins")
    .update({ full_name: fullName })
    .eq("id", admin.id);

  if (profileError) {
    return { success: false, message: t("updateFailed", { error: profileError.message }) };
  }

  logAudit(admin.id, "update", "admin", admin.id, {
    ...diffChanges({ full_name: admin.full_name }, { full_name: fullName }),
    ...(email && email !== admin.email ? { email: { from: admin.email, to: email } } : {}),
  });

  // 2. Sync to Auth Metadata for extra redundancy
  const supabase = await createClient();
  await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  // 3. Update Auth Email if changed
  if (email && email !== admin.email) {
    const { error: authError } = await supabase.auth.updateUser({ email });
    if (authError) {
      revalidatePath("/", "layout"); // Ensure layout updates
      return { success: true, message: t("emailFailed", { error: authError.message }) };
    }
    // Note: This usually triggers a confirmation email to the new address.
    revalidatePath("/", "layout");
    return { success: true, message: t("checkEmail") };
  }

  revalidatePath("/", "layout");
  return { success: true, message: t("updated") };
}
