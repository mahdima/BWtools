"use client";

import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Can } from "@/components/admin-provider";
import { Button } from "@/components/ui/button";
import { Column, ColumnDef } from "@tanstack/react-table";

import { deleteProduct, restoreProduct } from "./actions";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RestoreButton } from "@/components/restore-button";
import { formatPrice } from "@/lib/money";

export type Product = {
  id: number;
  product: string;
  category: string;
  price: number;
  brand: string;
  in_stock_vailable: number | null;
  // Listed under "Archived" (P6-08)
  archived: boolean;
};

type ColumnKey = "number" | "id" | "product" | "category" | "brand" | "price" | "stock" | "action";

// Column titles are components so they can use translations (TanStack renders them)
function ColumnLabel({ k }: { k: ColumnKey }) {
  return useTranslations("products.columns")(k);
}

function SortHeader({ column, k, width }: { column: Column<Product>; k: ColumnKey; width: string }) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className={`${width} justify-start ps-0 hover:bg-transparent h-8`}
    >
      <ColumnLabel k={k} />
      <ArrowUpDown className="ms-2 h-4 w-4" />
    </Button>
  );
}

function StockCell({ quantity }: { quantity: number }) {
  const t = useTranslations("products");
  const isOutOfStock = quantity === 0;
  return (
    <div className={`w-32 font-medium ${!isOutOfStock ? "text-green-600" : "text-red-600"}`}>
      {isOutOfStock ? t("outOfStock") : t("inStock", { count: quantity })}
    </div>
  );
}

function ProductActions({ product }: { product: Product }) {
  const t = useTranslations("products");

  // Viewers are read-only; the server actions check the role too
  if (product.archived) {
    return (
      <Can minRole="admin">
        <div className="flex justify-center">
          <RestoreButton name={product.product} action={() => restoreProduct(String(product.id))} />
        </div>
      </Can>
    );
  }

  return (
    <Can minRole="admin">
      <div className="flex justify-center items-center gap-1">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Link href={`/product?edit=${product.id}`} aria-label={t("edit", { name: product.product })}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <ConfirmDialog
          title={t("deleteTitle", { name: product.product })}
          description={t("deleteText")}
          confirmLabel={t("deleteConfirm")}
          destructive
          action={() => deleteProduct(String(product.id))}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("delete", { name: product.product })}
              className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </Can>
  );
}

export const columns: ColumnDef<Product>[] = [
  {
    id: "serial",
    header: () => (
      <div className="w-10">
        <ColumnLabel k="number" />
      </div>
    ),
    cell: ({ row }) => <div className="w-10 text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "id",
    header: () => (
      <div className="w-16">
        <ColumnLabel k="id" />
      </div>
    ),
    cell: ({ row }) => <div className="w-16 text-center">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "product",
    header: ({ column }) => <SortHeader column={column} k="product" width="w-64" />,
    cell: ({ row }) => (
      <div className="font-medium min-w-[150px]" title={row.getValue("product")}>
        {row.getValue("product")}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortHeader column={column} k="category" width="w-40" />,
    cell: ({ row }) => (
      <div className="min-w-[100px]" title={row.getValue("category")}>
        {row.getValue("category")}
      </div>
    ),
  },
  {
    accessorKey: "brand",
    header: ({ column }) => <SortHeader column={column} k="brand" width="w-32" />,
    cell: ({ row }) => (
      <div className="min-w-[100px]" title={row.getValue("brand")}>
        {row.getValue("brand")}
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => <SortHeader column={column} k="price" width="w-32" />,
    cell: ({ row }) => (
      <div className="w-32 font-medium" suppressHydrationWarning>
        {formatPrice(parseFloat(row.getValue("price")))}
      </div>
    ),
  },
  {
    accessorKey: "in_stock_vailable",
    header: () => (
      <div className="w-32 font-medium text-sm">
        <ColumnLabel k="stock" />
      </div>
    ),
    cell: ({ row }) => <StockCell quantity={(row.getValue("in_stock_vailable") as number | null) ?? 0} />,
  },
  {
    id: "actions",
    header: () => (
      <div className="text-center">
        <ColumnLabel k="action" />
      </div>
    ),
    cell: ({ row }) => <ProductActions product={row.original} />,
  },
];
