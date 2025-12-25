"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/CategoryForm";
import { deleteCategory } from "./actions";

export type Category = {
  id: string;
  category: string;
};

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "id",
    header: "ID",
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
            category={{ id: category.id, name: category.category }}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50"
            onClick={async () => {
              if (confirm("Are you sure you want to delete this category?")) {
                await deleteCategory(category.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
