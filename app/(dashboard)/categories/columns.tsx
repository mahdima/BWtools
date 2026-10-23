"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Can } from "@/components/admin-provider";
import Image from "next/image";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/CategoryForm";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RestoreButton } from "@/components/restore-button";
import { deleteCategory, restoreCategory } from "./actions";
import { useTranslations } from "next-intl";

export type Category = {
  id: number;
  category: string;
  image: string | null;
  // Listed under "Archived" (P6-08)
  archived: boolean;
};

// Column titles are components so they can use translations (TanStack renders them)
function ColumnLabel({ k }: { k: "id" | "image" | "category" | "action" }) {
  return useTranslations("categories.columns")(k);
}

function CategoryActions({ category }: { category: Category }) {
  const t = useTranslations("categories");

  // Viewers are read-only; the server actions check the role too
  if (category.archived) {
    return (
      <Can minRole="admin">
        <RestoreButton name={category.category} action={() => restoreCategory(String(category.id))} />
      </Can>
    );
  }

  return (
    <Can minRole="admin">
      <div className="flex items-center gap-1">
        <CategoryForm
          category={{ id: String(category.id), name: category.category, imageUrl: category.image }}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("edit", { name: category.category })}
              className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />

        <ConfirmDialog
          title={t("deleteTitle", { name: category.category })}
          description={t("deleteText")}
          confirmLabel={t("deleteConfirm")}
          destructive
          action={() => deleteCategory(String(category.id))}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("delete", { name: category.category })}
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

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "id",
    header: () => <ColumnLabel k="id" />,
  },
  {
    id: "image",
    header: () => <ColumnLabel k="image" />,
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
    header: () => <ColumnLabel k="category" />,
    cell: ({ row }) => (
      <div className="font-medium text-gray-900">
        {row.getValue("category")}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <ColumnLabel k="action" />,
    cell: ({ row }) => <CategoryActions category={row.original} />,
  },
];
