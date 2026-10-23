"use client";

import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Can } from "@/components/admin-provider";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { deleteBrand, restoreBrand } from "./actions";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";
import { RestoreButton } from "@/components/restore-button";

export type Brand = {
  id: number;
  brand: string;
  // Listed under "Archived" (P6-08)
  archived: boolean;
};

// Column titles are components so they can use translations (TanStack renders them)
function ColumnLabel({ k }: { k: "number" | "id" | "name" | "action" }) {
  return useTranslations("brands.columns")(k);
}

function BrandActions({ brand }: { brand: Brand }) {
  const t = useTranslations("brands");

  // Viewers are read-only; the server actions check the role too
  if (brand.archived) {
    return (
      <Can minRole="admin">
        <div className="flex justify-center">
          <RestoreButton name={brand.brand} action={() => restoreBrand(String(brand.id))} />
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
          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-blue-500/10 transition-colors"
        >
          <Link href={`/brand?edit=${brand.id}`} aria-label={t("edit", { name: brand.brand })}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <ConfirmDialog
          title={t("deleteTitle", { name: brand.brand })}
          description={t("deleteText")}
          confirmLabel={t("deleteConfirm")}
          destructive
          action={() => deleteBrand(String(brand.id))}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("delete", { name: brand.brand })}
              className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </Can>
  );
}

export const columns: ColumnDef<Brand>[] = [
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
    cell: ({ row }) => (
      <div className="w-16 text-center">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "brand",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-start ps-0 hover:bg-transparent h-8"
        >
          <ColumnLabel k="name" />
          <ArrowUpDown className="ms-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div
        className="truncate font-medium text-foreground"
        title={row.getValue("brand")}
      >
        {row.getValue("brand")}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => (
      <div className="text-center">
        <ColumnLabel k="action" />
      </div>
    ),
    cell: ({ row }) => <BrandActions brand={row.original} />,
  },
];
