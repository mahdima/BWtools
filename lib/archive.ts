import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ActionResult } from "@/lib/action-result";

// Soft delete (P6-08): docs/sql/P6-08-soft-delete.sql adds `is_archived` to products,
// brands and categories. Until the owner applies it the column is missing, so lists
// show every row as before and nothing can be archived.

// 42703: a filter names a missing column. PGRST204: an update sets one.
export const isMissingColumn = (error: { code?: string } | null) =>
  error?.code === "42703" || error?.code === "PGRST204";

// Runs a list query for active rows (`archived` false) or archived ones (true). If the
// column doesn't exist yet, `run` is called again with null and must skip the filter;
// without the column nothing is archived, so the archived list is then null.
// Don't use head: true in `run`: a failed HEAD request carries no error code.
export async function queryByArchived<R extends { error: { code?: string } | null }>(
  archived: boolean,
  run: (archived: boolean | null) => PromiseLike<R>,
): Promise<{ result: R | null; archiving: boolean }> {
  const result = await run(archived);
  if (!isMissingColumn(result.error)) return { result, archiving: true };
  return { result: archived ? null : await run(null), archiving: false };
}

export type ArchiveTable = "products" | "brands" | "categories";

const ID_COLUMNS: Record<ArchiveTable, string> = {
  products: "product_id",
  brands: "brand_id",
  categories: "categorie_id",
};

// Archives or restores one row. "unavailable" until the column exists.
export async function setArchived(
  table: ArchiveTable,
  id: number,
  archived: boolean,
): Promise<{ status: "done" | "not_found" | "unavailable" } | { status: "failed"; message: string }> {
  const idColumn = ID_COLUMNS[table];
  // The column isn't in the generated types until the owner applies the SQL
  const { data, error } = await (supabaseAdmin as unknown as SupabaseClient)
    .from(table)
    .update({ is_archived: archived })
    .eq(idColumn, id)
    .select(idColumn);

  if (isMissingColumn(error)) return { status: "unavailable" };
  if (error) {
    console.error(`Error ${archived ? "archiving" : "restoring"} a row of ${table}:`, error);
    return { status: "failed", message: error.message };
  }
  return { status: data?.length ? "done" : "not_found" };
}

// The result to show for a setArchived outcome. `unavailable` is the message for when
// the column doesn't exist yet; `failed` is prefixed to the database error.
export function archiveResult(
  outcome: Awaited<ReturnType<typeof setArchived>>,
  messages: { done: string; notFound: string; unavailable: string; failed: string },
): ActionResult {
  switch (outcome.status) {
    case "done":
      return { success: true, message: messages.done };
    case "not_found":
      return { success: false, message: messages.notFound };
    case "unavailable":
      return { success: false, message: messages.unavailable };
    case "failed":
      return { success: false, message: `${messages.failed}: ${outcome.message}` };
  }
}

// Whether any active product uses this category or brand, or null when that can't be
// told (no is_archived column yet, or the query failed).
export async function hasActiveProducts(column: "Category_id" | "brand_id", id: number): Promise<boolean | null> {
  const { count, error } = await supabaseAdmin
    .from("products")
    .select("product_id", { count: "exact" })
    .eq(column, id)
    .eq("is_archived", false)
    .limit(1);

  if (error) {
    if (!isMissingColumn(error)) console.error("Error counting active products:", error);
    return null;
  }
  return count !== 0;
}
