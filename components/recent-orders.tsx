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
import { useTranslations } from "next-intl";
import { formatDA } from "@/lib/money";
import { isOrderStatus } from "@/lib/orders";

interface Order {
  id: number;
  total: number;
  status: string | null;
  created_at: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const t = useTranslations("dashboard");
  const status = useTranslations("orderStatus");
  const statusColors: Record<string, string> = {
    New: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20",
    processing: "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20",
    Delivering: "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20",
    Delivered: "bg-muted text-foreground/80 hover:bg-accent",
    Cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20",
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between flex-none">
        <div>
          <h3 className="font-bold text-lg text-foreground">{t("recentOrders")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("latestTransactions")}</p>
        </div>
        <Link
          href="/order"
          aria-label={t("viewAllOrders")}
          className="p-2 rounded-full hover:bg-muted/60 transition-colors text-muted-foreground/70 hover:text-foreground"
        >
          <ArrowUpRight className="h-5 w-5 rtl:-scale-x-100" />
        </Link>
      </div>
      <div className="p-0 flex-1 overflow-auto min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground ps-6 h-10">
                {t("orderId")}
              </TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground h-10">
                {t("status")}
              </TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground text-end pe-6 h-10">
                {t("amount")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="border-border hover:bg-muted/40 cursor-default"
              >
                <TableCell className="font-medium text-foreground ps-6 py-4">
                  #{order.id}
                </TableCell>
                <TableCell className="py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-transparent ${
                      statusColors[order.status ?? ""] || "bg-muted text-foreground/80"
                    }`}
                  >
                    {isOrderStatus(order.status) ? status(order.status) : order.status}
                  </span>
                </TableCell>
                <TableCell className="text-end font-medium text-foreground pe-6 py-4">
                  {formatDA(order.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
