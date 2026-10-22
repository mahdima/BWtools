"use client";

import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Can } from "@/components/admin-provider";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { deleteBrand, restoreBrand } from "./actions";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RestoreButton } from "@/components/restore-button";

export type Brand = {
  id: number;
  brand: string;
  // Listed under "Archived" (P6-08)
  archived: boolean;
};

export const columns: ColumnDef<Brand>[] = [
  {
    id: "serial",
    header: () => <div className="w-10">N°</div>,
    cell: ({ row }) => <div className="w-10 text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "id",
    header: () => <div className="w-16">Brand ID</div>,
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
          className="justify-start pl-0 hover:bg-transparent h-8"
        >
          Brand Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div
        className="truncate font-medium text-gray-900"
        title={row.getValue("brand")}
      >
        {row.getValue("brand")}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-center">Action</div>,
    cell: ({ row }) => {
      const brand = row.original;

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
            className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Link href={`/brand?edit=${brand.id}`} aria-label={`Edit ${brand.brand}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <ConfirmDialog
            title={`Delete brand "${brand.brand}"?`}
            description="This permanently removes the brand. A brand that still has products can't be deleted; one used only by archived products is archived instead."
            confirmLabel="Delete"
            destructive
            action={() => deleteBrand(String(brand.id))}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${brand.brand}`}
                className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
        </Can>
      );
    },
  },
];
