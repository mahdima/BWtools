import "server-only";
import { auditTable } from "@/lib/audit";
import type { AuditEntity } from "@/lib/audit-changes";
import { isMissingTableError } from "@/lib/store-settings";

export type AuditEntry = {
  id: number;
  created_at: string;
  admin_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  admins: { full_name: string | null } | null;
};

// One page of the audit log, newest first, optionally for one kind of record.
// `available` is false until the audit_log table exists.
export async function getAuditLog({
  page = 1,
  limit = 50,
  entity,
}: {
  page?: number;
  limit?: number;
  entity?: AuditEntity;
}) {
  const from = (page - 1) * limit;

  let query = auditTable()
    .select("*, admins(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + limit - 1);
  if (entity) query = query.eq("entity", entity);

  const { data, error, count } = await query;

  if (error) {
    if (!isMissingTableError(error)) console.error("Error fetching the audit log:", error);
    return { data: [] as AuditEntry[], count: 0, available: !isMissingTableError(error) };
  }

  return { data: (data ?? []) as AuditEntry[], count: count ?? 0, available: true };
}
