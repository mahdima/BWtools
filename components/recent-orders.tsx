import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const statusColors: Record<string, string> = {
    New: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    processing: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    Delivering: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    Delivered: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    Cancelled: "bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-none">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Recent Orders</h3>
          <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
        </div>
        <Link
          href="/order"
          className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600"
        >
          <ArrowUpRight className="h-5 w-5" />
        </Link>
      </div>
      <div className="p-0 flex-1 overflow-auto min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-50">
              <TableHead className="font-medium text-xs uppercase tracking-wider text-gray-500 pl-6 h-10">
                Order ID
              </TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider text-gray-500 h-10">
                Status
              </TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider text-gray-500 text-right pr-6 h-10">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="border-gray-50 hover:bg-gray-50/50 cursor-default"
              >
                <TableCell className="font-medium text-gray-900 pl-6 py-4">
                  #{order.id}
                </TableCell>
                <TableCell className="py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-transparent ${
                      statusColors[order.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-gray-900 pr-6 py-4">
                  {new Intl.NumberFormat("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                  })
                    .format(order.total)
                    .replace("DZD", "DA")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
