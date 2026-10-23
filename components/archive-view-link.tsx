import Link from "next/link";
import { useTranslations } from "next-intl";

// Header link between a list's active rows and its archived ones (?view=archived).
export function ArchiveViewLink({ href, archived }: { href: string; archived: boolean }) {
  const t = useTranslations("archive");
  return (
    <Link
      href={archived ? href : `${href}?view=archived`}
      className="text-sm font-medium text-primary hover:text-primary-strong whitespace-nowrap"
    >
      {archived ? t("backToActive") : t("archived")}
    </Link>
  );
}
