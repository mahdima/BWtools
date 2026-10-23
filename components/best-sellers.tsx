import Link from "next/link";
import type { SalesRow } from "@/lib/reports";
import { formatDA } from "@/lib/money";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// The best-selling products of a period by sales, with units sold (P7-02).
export function BestSellers({ rows }: { rows: SalesRow[] }) {
  const t = useTranslations("reports");
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <h2 className="text-lg font-bold text-foreground">{t("bestSellers")}</h2>
        <p className="text-xs text-muted-foreground">{t("topProducts", { count: rows.length || 10 })}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="h-10 w-12 ps-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">#</TableHead>
              <TableHead className="h-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("product")}</TableHead>
              <TableHead className="h-10 text-end text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("units")}</TableHead>
              <TableHead className="h-10 pe-6 text-end text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("sales")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {t("noSales")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${row.id}-${row.label}`} className="border-border hover:bg-muted/40">
                  <TableCell className="ps-6 tabular-nums text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {row.id !== null && !row.missing ? (
                      <Link href={`/product?search=${encodeURIComponent(row.label)}`} className="hover:text-primary">
                        {row.label}
                      </Link>
                    ) : (
                      t("missingProduct")
                    )}
                  </TableCell>
                  <TableCell className="text-end tabular-nums text-foreground/80">{row.quantity}</TableCell>
                  <TableCell className="pe-6 text-end font-medium tabular-nums text-foreground">{formatDA(row.revenue)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
