import Link from "next/link";
import type { AuditEntry } from "@/lib/data/audit";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  formatChanges,
  isAuditEntity,
  type AuditAction,
} from "@/lib/audit-changes";
import { STORE_TIME_ZONE } from "@/lib/dates";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: STORE_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

// Where a logged record can be opened, if anywhere.
function entityHref(entity: string, id: string | null): string | null {
  switch (entity) {
    case "product":
      return id ? `/product?edit=${id}` : "/product";
    case "brand":
      return id ? `/brand?edit=${id}` : "/brand";
    case "category":
      return "/categories";
    case "order":
      return id ? `/order/${id}` : "/order";
    case "customer":
      return id ? `/customers/${id}` : "/customers";
    case "admin":
      return "/team";
    case "store_settings":
      return "/settings";
    default:
      return null;
  }
}

function EntryRow({ entry }: { entry: AuditEntry }) {
  const entityLabel = isAuditEntity(entry.entity) ? AUDIT_ENTITY_LABELS[entry.entity] : entry.entity;
  const href = entityHref(entry.entity, entry.entity_id);
  // Customer and admin ids are UUIDs, too long to show; the link still opens the record
  const shownId = entry.entity_id && /^\d+$/.test(entry.entity_id) && entry.entity !== "store_settings" ? ` #${entry.entity_id}` : "";
  const changes = formatChanges(entry.changes);

  return (
    <tr className="border-b border-gray-100 align-top last:border-0">
      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{timeFormat.format(new Date(entry.created_at))}</td>
      <td className="px-4 py-3 font-medium text-gray-900">
        {entry.admins?.full_name || (entry.admin_id ? "Unnamed admin" : "Deleted admin")}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {AUDIT_ACTION_LABELS[entry.action as AuditAction] ?? entry.action}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {href ? (
          <Link href={href} className="text-primary hover:text-primary-strong hover:underline">
            {entityLabel}
            {shownId}
          </Link>
        ) : (
          `${entityLabel}${shownId}`
        )}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {changes.length > 0 ? (
          <ul className="space-y-0.5">
            {changes.map((line, index) => (
              <li key={index} className="break-words">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

// The audit log entries as a table (the /audit page).
export function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">When</th>
            <th scope="col" className="px-4 py-3 font-medium">Who</th>
            <th scope="col" className="px-4 py-3 font-medium">Action</th>
            <th scope="col" className="px-4 py-3 font-medium">Record</th>
            <th scope="col" className="px-4 py-3 font-medium">Changes</th>
          </tr>
        </thead>
        <tbody>
          {entries.length > 0 ? (
            entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)
          ) : (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                Nothing recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
