import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  DEFAULT_STORE_SETTINGS,
  isMissingTableError,
  storeSettingsSchema,
  type StoreSettings,
} from "@/lib/store-settings";

// `store_settings` is not in the generated types until the owner applies
// docs/sql/P6-01-store-settings.sql and runs `npm run db:types`, so this uses an
// untyped client; rows are validated with storeSettingsSchema instead.
export function storeSettingsTable() {
  return (supabaseAdmin as unknown as SupabaseClient).from("store_settings");
}

// The store settings, or the defaults while the table or its row doesn't exist.
// `isDefault` tells the Settings page that saving needs the SQL first.
export async function getStoreSettings(): Promise<StoreSettings & { isDefault: boolean }> {
  const { data, error } = await storeSettingsTable().select("*").eq("id", 1).maybeSingle();

  if (error && !isMissingTableError(error)) {
    console.error("Error loading store settings:", error);
  }

  const parsed = storeSettingsSchema.safeParse(data);
  return parsed.success ? { ...parsed.data, isDefault: false } : { ...DEFAULT_STORE_SETTINGS, isDefault: true };
}
