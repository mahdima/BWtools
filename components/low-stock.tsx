import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  product_id: number;
  product_name: string;
  in_stock_vailable: number;
}

interface LowStockProps {
  products: Product[];
}

export function LowStock({ products }: LowStockProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-none">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg text-gray-900">Low Stock Alert</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-bold">{products.length} Items</span>
        </div>
      </div>
      <div className="p-0 flex-1 overflow-auto min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-50">
              <TableHead className="font-medium text-xs uppercase tracking-wider text-gray-500 pl-6 h-10">
                Product
              </TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider text-gray-500 text-right pr-6 h-10">
                Stock
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-gray-500 py-8"
                >
                  No low stock products.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow
                  key={product.product_id}
                  className="border-gray-50 hover:bg-gray-50/50"
                >
                  <TableCell className="font-medium text-gray-900 pl-6 py-4">
                    {product.product_name}
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600">
                      {product.in_stock_vailable} left
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
