import "server-only";
import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { AuditAction, AuditEntity } from "@/lib/audit-changes";
import { isMissingTableError } from "@/lib/store-settings";

// audit_log (docs/sql/P7-01-audit-log.sql) isn't in the generated types until the owner
// applies it, hence the untyped client.
export const auditTable = () => (supabaseAdmin as unknown as SupabaseClient).from("audit_log");

// Records that an admin changed something. Call it after the change succeeded. The
// insert runs after the response is sent, so logging never delays or fails the action,
// and it's skipped while the table doesn't exist.
export function logAudit(
  adminId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string | number | null,
  changes?: Record<string, unknown>,
) {
  after(async () => {
    const { error } = await auditTable().insert({
      admin_id: adminId,
      action,
      entity,
      entity_id: entityId === null ? null : String(entityId),
      changes: changes && Object.keys(changes).length > 0 ? changes : null,
    });
    if (error && !isMissingTableError(error)) console.error("Failed to write the audit log:", error);
  });
}
