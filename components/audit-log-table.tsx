import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { AuditEntry } from "@/lib/data/audit";
import { formatChanges, isAuditAction, isAuditEntity, type ChangeLabels } from "@/lib/audit-changes";
import { STORE_TIME_ZONE } from "@/lib/dates";
import { intlLocale } from "@/lib/i18n";
import { isOrderStatus } from "@/lib/orders";
import { isRole } from "@/lib/roles";

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

// The words formatChanges needs, in the admin's language.
function useChangeLabels(): ChangeLabels {
  const t = useTranslations("audit");
  const roles = useTranslations("roles");
  const statuses = useTranslations("orderStatus");

  return {
    field: (key) => t(`fields.${key}`),
    value: (field, value) =>
      field === "role" && isRole(value)
        ? roles(value)
        : field === "status" && isOrderStatus(value)
          ? statuses(value)
          : undefined,
    yes: t("yes"),
    no: t("no"),
    empty: t("empty"),
    image: { added: t("imageAdded"), removed: t("imageRemoved"), replaced: t("imageReplaced") },
    line: (field, value) => t("line", { field, value }),
    change: (from, to) => t("change", { from, to }),
  };
}

function EntryRow({ entry, labels, time }: { entry: AuditEntry; labels: ChangeLabels; time: Intl.DateTimeFormat }) {
  const t = useTranslations("audit");
  const entityLabel = isAuditEntity(entry.entity) ? t(`entities.${entry.entity}`) : entry.entity;
  const href = entityHref(entry.entity, entry.entity_id);
  // Customer and admin ids are UUIDs, too long to show; the link still opens the record
  const shownId = entry.entity_id && /^\d+$/.test(entry.entity_id) && entry.entity !== "store_settings" ? ` #${entry.entity_id}` : "";
  const changes = formatChanges(entry.changes, labels);

  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{time.format(new Date(entry.created_at))}</td>
      <td className="px-4 py-3 font-medium text-foreground">
        {entry.admins?.full_name || (entry.admin_id ? t("unnamedAdmin") : t("deletedAdmin"))}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {isAuditAction(entry.action) ? t(`actions.${entry.action}`) : entry.action}
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
      <td className="px-4 py-3 text-muted-foreground">
        {changes.length > 0 ? (
          <ul className="space-y-0.5">
            {changes.map((line, index) => (
              <li key={index} className="break-words">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-muted-foreground/70">—</span>
        )}
      </td>
    </tr>
  );
}

// The audit log entries as a table (the /audit page).
export function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  const t = useTranslations("audit");
  const labels = useChangeLabels();
  const time = new Intl.DateTimeFormat(intlLocale(useLocale()), {
    timeZone: STORE_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] text-start text-sm">
        <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">{t("when")}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t("who")}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t("action")}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t("record")}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t("changes")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.length > 0 ? (
            entries.map((entry) => <EntryRow key={entry.id} entry={entry} labels={labels} time={time} />)
          ) : (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                {t("nothing")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
