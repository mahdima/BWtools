import Link from "next/link";

// Header link between a list's active rows and its archived ones (?view=archived).
export function ArchiveViewLink({ href, archived }: { href: string; archived: boolean }) {
  return (
    <Link
      href={archived ? href : `${href}?view=archived`}
      className="text-sm font-medium text-primary hover:text-primary-strong whitespace-nowrap"
    >
      {archived ? "Back to active" : "Archived"}
    </Link>
  );
}
