"use server";

import { getTranslations } from "next-intl/server";
import { notAuthorized, parseFormT } from "@/lib/server-messages";

import { createClient } from "@/utils/supabase/server";
import { getAuthorizedAdmin } from "@/lib/auth";
import { passwordChangeSchema } from "@/lib/validation/admin";
import { type ActionResult } from "@/lib/action-result";
import { isMissingTableError, storeSettingsSchema } from "@/lib/store-settings";
import { getStoreSettings, storeSettingsTable } from "@/lib/data/settings";
import { logAudit } from "@/lib/audit";
import { diffChanges } from "@/lib/audit-changes";
import { revalidatePath } from "next/cache";

export async function updatePassword(formData: FormData) {
  // Any active admin may change their own password.
  const admin = await getAuthorizedAdmin("viewer");
  if (!admin) return notAuthorized();
  const t = await getTranslations("actions.settings");

  // Same rules as new admin accounts: 8 to 72 characters, and both fields must match
  const parsed = await parseFormT(passwordChangeSchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }
  const { password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, message: error.message };
  }

  logAudit(admin.id, "password_change", "admin", admin.id);
  return { success: true, message: t("passwordUpdated") };
}

// Form action (via useFormAction): super admins edit the store-wide settings.
export async function updateStoreSettings(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin("super_admin");
  if (!admin) return notAuthorized();
  const t = await getTranslations("actions.settings");

  const parsed = await parseFormT(storeSettingsSchema, formData);
  if (!parsed.success) {
    return { success: false, message: parsed.message };
  }

  // The previous values, for the audit log
  const before = await getStoreSettings();

  const { error } = await storeSettingsTable().upsert({
    id: 1,
    ...parsed.data,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error saving store settings:", error);
    return {
      success: false,
      message: isMissingTableError(error)
        ? t("storeTableMissing")
        : t("storeSaveFailed", { error: error.message }),
    };
  }

  logAudit(admin.id, "update", "store_settings", 1, diffChanges(before, parsed.data));
  revalidatePath("/settings");
  return { success: true, message: t("storeSaved") };
}
