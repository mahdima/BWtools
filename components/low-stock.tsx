import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LowStockProps {
  products: { product_id: number; product_name: string; in_stock_vailable: number | null }[];
  // All products at or below the threshold (the list shows the first few)
  total: number;
  threshold: number;
}

export function LowStock({ products, total, threshold }: LowStockProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-none">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Low Stock Alert</h3>
          <p className="text-xs text-gray-500">{threshold} or fewer in stock</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <span className="text-xs font-bold">
            {total} {total === 1 ? "item" : "items"}
          </span>
        </div>
      </div>
      <div className="p-0 flex-1 overflow-auto min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-50">
              <TableHead className="font-medium text-xs uppercase tracking-wider text-gray-500 ps-6 h-10">
                Product
              </TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider text-gray-500 text-end pe-6 h-10">
                Stock
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                  No low stock products.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.product_id} className="border-gray-50 hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900 ps-6 py-4">
                    <Link href={`/product?edit=${product.product_id}`} className="hover:text-primary">
                      {product.product_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-end pe-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600">
                      {(product.in_stock_vailable ?? 0) === 0 ? "Out of stock" : `${product.in_stock_vailable} left`}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {total > 0 && (
        <div className="px-6 py-3 border-t border-gray-50 text-end">
          <Link href="/product?stock=low" className="text-sm font-medium text-primary hover:text-primary-strong">
            View all low-stock products
          </Link>
        </div>
      )}
    </div>
  );
}
