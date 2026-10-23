"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/i18n";
import { formatPrice } from "@/lib/money";
import { isOrderStatus } from "@/lib/orders";

export type Order = {
  id: number;
  total: number;
  created_at: string;
  status: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  New: "text-green-600 dark:text-green-400",
  processing: "text-primary",
  Delivering: "text-yellow-600 dark:text-yellow-400",
  Delivered: "text-orange-600 dark:text-orange-400",
  Cancelled: "text-red-800 dark:text-red-400",
};

// Column titles are components so they can use translations (TanStack renders them)
function ColumnLabel({ k }: { k: "id" | "total" | "status" | "createdAt" }) {
  return useTranslations("orders.columns")(k);
}

function StatusCell({ status }: { status: string | null }) {
  const t = useTranslations("orderStatus");
  return (
    <div className={`font-medium ${STATUS_COLORS[status ?? ""] ?? "text-muted-foreground"}`}>
      {isOrderStatus(status) ? t(status) : status}
    </div>
  );
}

function DateCell({ value }: { value: string }) {
  return <div>{formatDate(value, useLocale())}</div>;
}

function OrderMenu({ order }: { order: Order }) {
  const t = useTranslations("orders");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{t("openMenu")}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(order.id))}>
          {t("copyId")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/invoice/${order.id}`} target="_blank">
            {t("printInvoice")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: () => <ColumnLabel k="id" />,
  },
  {
    accessorKey: "total",
    header: () => <ColumnLabel k="total" />,
    cell: ({ row }) => <div className="font-medium">{formatPrice(parseFloat(row.getValue("total")))}</div>,
  },
  {
    accessorKey: "status",
    header: () => <ColumnLabel k="status" />,
    cell: ({ row }) => <StatusCell status={row.getValue("status") as string | null} />,
  },
  {
    accessorKey: "created_at",
    header: () => <ColumnLabel k="createdAt" />,
    cell: ({ row }) => <DateCell value={row.getValue("created_at")} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <OrderMenu order={row.original} />,
  },
];
