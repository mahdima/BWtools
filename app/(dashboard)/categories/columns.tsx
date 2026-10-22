"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/CategoryForm";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteCategory } from "./actions";

export type Category = {
  id: number;
  category: string;
  image: string | null;
};

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    id: "image",
    header: "Image",
    cell: ({ row }) =>
      row.original.image ? (
        <Image
          src={row.original.image}
          alt={row.original.category}
          width={40}
          height={40}
          className="h-10 w-10 rounded-md object-cover border border-gray-100"
          unoptimized
        />
      ) : (
        <div className="h-10 w-10 rounded-md bg-gray-100" aria-hidden />
      ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <div className="font-medium text-gray-900">
        {row.getValue("category")}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const category = row.original;

      return (
        <div className="flex items-center gap-1">
          <CategoryForm
            category={{ id: String(category.id), name: category.category, imageUrl: category.image }}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${category.category}`}
                className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />

          <ConfirmDialog
            title={`Delete category "${category.category}"?`}
            description="This permanently removes the category. Categories that still have products can't be deleted."
            confirmLabel="Delete"
            destructive
            action={() => deleteCategory(String(category.id))}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${category.category}`}
                className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      );
    },
  },
];
