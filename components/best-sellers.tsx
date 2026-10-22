import Link from "next/link";
import type { SalesRow } from "@/lib/reports";
import { formatDA } from "@/lib/money";
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
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 p-6">
        <h2 className="text-lg font-bold text-gray-900">Best sellers</h2>
        <p className="text-xs text-gray-500">Top {rows.length || 10} products by sales</p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-50 hover:bg-transparent">
              <TableHead className="h-10 w-12 pl-6 text-xs font-medium uppercase tracking-wider text-gray-500">#</TableHead>
              <TableHead className="h-10 text-xs font-medium uppercase tracking-wider text-gray-500">Product</TableHead>
              <TableHead className="h-10 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Units</TableHead>
              <TableHead className="h-10 pr-6 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                  No sales in this period.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${row.id}-${row.label}`} className="border-gray-50 hover:bg-gray-50/50">
                  <TableCell className="pl-6 tabular-nums text-gray-500">{index + 1}</TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {row.id !== null ? (
                      <Link href={`/product?search=${encodeURIComponent(row.label)}`} className="hover:text-primary">
                        {row.label}
                      </Link>
                    ) : (
                      row.label
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-700">{row.quantity}</TableCell>
                  <TableCell className="pr-6 text-right font-medium tabular-nums text-gray-900">{formatDA(row.revenue)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
