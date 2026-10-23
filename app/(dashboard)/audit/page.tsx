import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { getAuditLog } from "@/lib/data/audit";
import { AUDIT_ENTITIES, isAuditEntity, type AuditEntity } from "@/lib/audit-changes";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("audit");

  const params = await searchParams;
  const entity = isAuditEntity(params.entity) ? params.entity : undefined;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  const { data, count, available } = await getAuditLog({ page, limit: PAGE_SIZE, entity });
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="flex h-full w-full flex-col overflow-auto p-4 ps-16 lg:ps-4">
      <div className="py-4">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {!available ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-400">
          {t("notSetUp")}
        </div>
      ) : (
        <>
          <nav aria-label={t("filterLabel")} className="mb-4 flex flex-wrap gap-2">
            {[undefined, ...AUDIT_ENTITIES].map((value) => {
              const active = value === entity;
              return (
                <Link
                  key={value ?? "all"}
                  href={auditUrl(value)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {value ? t(`entities.${value}`) : t("all")}
                </Link>
              );
            })}
          </nav>

          <AuditLogTable entries={data} />

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("pageSummary", { page, count: pageCount, entries: count })}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={auditUrl(entity, page - 1)} className="rounded-md border border-border bg-card px-3 py-1.5 hover:bg-muted/60">
                    {t("previous")}
                  </Link>
                )}
                {page < pageCount && (
                  <Link href={auditUrl(entity, page + 1)} className="rounded-md border border-border bg-card px-3 py-1.5 hover:bg-muted/60">
                    {t("next")}
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
