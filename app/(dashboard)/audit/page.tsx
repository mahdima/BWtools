import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { getAuditLog } from "@/lib/data/audit";
import { AUDIT_ENTITY_LABELS, isAuditEntity, type AuditEntity } from "@/lib/audit-changes";
import { AuditLogTable } from "@/components/audit-log-table";

const PAGE_SIZE = 50;

function auditUrl(entity: AuditEntity | undefined, page = 1) {
  const params = new URLSearchParams();
  if (entity) params.set("entity", entity);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/audit${query ? `?${query}` : ""}`;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdminPage("super_admin");

  const params = await searchParams;
  const entity = isAuditEntity(params.entity) ? params.entity : undefined;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  const { data, count, available } = await getAuditLog({ page, limit: PAGE_SIZE, entity });
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="flex h-full w-full flex-col overflow-auto p-4 pl-16 lg:pl-4">
      <div className="py-4">
        <h1 className="text-2xl font-bold text-gray-900">Audit log</h1>
        <p className="text-sm text-gray-500">Who changed what in the dashboard, newest first</p>
      </div>

      {!available ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          The audit log isn&apos;t set up yet. Ask the project owner to run{" "}
          <code className="font-mono">docs/sql/P7-01-audit-log.sql</code> in Supabase; changes are recorded from then on.
        </div>
      ) : (
        <>
          <nav aria-label="Filter by record type" className="mb-4 flex flex-wrap gap-2">
            {[undefined, ...(Object.keys(AUDIT_ENTITY_LABELS) as AuditEntity[])].map((value) => {
              const active = value === entity;
              return (
                <Link
                  key={value ?? "all"}
                  href={auditUrl(value)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {value ? AUDIT_ENTITY_LABELS[value] : "All"}
                </Link>
              );
            })}
          </nav>

          <AuditLogTable entries={data} />

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {page} of {pageCount} · {count} entries
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={auditUrl(entity, page - 1)} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50">
                    Previous
                  </Link>
                )}
                {page < pageCount && (
                  <Link href={auditUrl(entity, page + 1)} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50">
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
