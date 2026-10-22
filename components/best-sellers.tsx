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
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 p-6">
        <h2 className="text-lg font-bold text-gray-900">{t("bestSellers")}</h2>
        <p className="text-xs text-gray-500">{t("topProducts", { count: rows.length || 10 })}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-50 hover:bg-transparent">
              <TableHead className="h-10 w-12 ps-6 text-xs font-medium uppercase tracking-wider text-gray-500">#</TableHead>
              <TableHead className="h-10 text-xs font-medium uppercase tracking-wider text-gray-500">{t("product")}</TableHead>
              <TableHead className="h-10 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t("units")}</TableHead>
              <TableHead className="h-10 pe-6 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t("sales")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                  {t("noSales")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${row.id}-${row.label}`} className="border-gray-50 hover:bg-gray-50/50">
                  <TableCell className="ps-6 tabular-nums text-gray-500">{index + 1}</TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {row.id !== null && !row.missing ? (
                      <Link href={`/product?search=${encodeURIComponent(row.label)}`} className="hover:text-primary">
                        {row.label}
                      </Link>
                    ) : (
                      t("missingProduct")
                    )}
                  </TableCell>
                  <TableCell className="text-end tabular-nums text-gray-700">{row.quantity}</TableCell>
                  <TableCell className="pe-6 text-end font-medium tabular-nums text-gray-900">{formatDA(row.revenue)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
