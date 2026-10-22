"use server";

import { createClient } from "@/utils/supabase/server";
import { getAuthorizedAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/validation/form";
import { passwordChangeSchema } from "@/lib/validation/admin";
import { NOT_AUTHORIZED, type ActionResult } from "@/lib/action-result";
import { isMissingTableError, storeSettingsSchema } from "@/lib/store-settings";
import { getStoreSettings, storeSettingsTable } from "@/lib/data/settings";
import { logAudit } from "@/lib/audit";
import { diffChanges } from "@/lib/audit-changes";
import { revalidatePath } from "next/cache";

export async function updatePassword(formData: FormData) {
  // Any active admin may change their own password.
  const admin = await getAuthorizedAdmin("viewer");
  if (!admin) {
    return { success: false, message: "Not authorized" };
  }

  // Same rules as new admin accounts: 8 to 72 characters, and both fields must match
  const parsed = parseForm(passwordChangeSchema, formData);
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
  return { success: true, message: "Password updated successfully" };
}

// Form action (via useFormAction): super admins edit the store-wide settings.
export async function updateStoreSettings(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await getAuthorizedAdmin("super_admin");
  if (!admin) return NOT_AUTHORIZED;

  const parsed = parseForm(storeSettingsSchema, formData);
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
        ? "The store settings table doesn't exist yet. Ask the project owner to run docs/sql/P6-01-store-settings.sql."
        : `Failed to save settings: ${error.message}`,
    };
  }

  logAudit(admin.id, "update", "store_settings", 1, diffChanges(before, parsed.data));
  revalidatePath("/settings");
  return { success: true, message: "Store settings saved." };
}
