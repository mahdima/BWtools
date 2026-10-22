"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  addCategory,
  updateCategory,
} from "@/app/(dashboard)/categories/actions";
import { ProductImageUpload } from "@/components/ProductImageUpload";
import { useFormAction } from "@/lib/use-form-action";

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
  trigger?: React.ReactNode;
}

export function CategoryForm({ category, trigger }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger || (
          <button className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
      </div>

      {/* Portal only renders after a click, so `document` always exists here.
          The dialog body mounts on open, so each open starts without an old error. */}
      {isOpen &&
        createPortal(
          <CategoryDialog category={category} onClose={() => setIsOpen(false)} />,
          document.body
        )}
    </>
  );
}

function CategoryDialog({
  category,
  onClose,
}: {
  category?: CategoryFormProps["category"];
  onClose: () => void;
}) {
  const isEdit = !!category;
  const { state, isPending, onSubmit } = useFormAction(async (_prev, formData) => {
    const result = await (isEdit ? updateCategory : addCategory)(formData);
    if (result.success) {
      onClose();
      toast.success(result.message);
    }
    return result;
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-semibold text-lg text-gray-900">
            {isEdit ? "Edit Category" : "Add New Category"}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            type="button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {isEdit && <input type="hidden" name="id" value={category.id} />}

          {state && !state.success && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {state.message}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="categoryName" className="text-sm font-medium text-gray-700">
              Category Name
            </label>
            <input
              id="categoryName"
              name="categoryName"
              defaultValue={category?.name || ""}
              required
              autoFocus
              className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-sm"
              placeholder="e.g., Tools"
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Image</span>
            <ProductImageUpload
              name="categoryImage"
              defaultValue={category?.imageUrl}
              label="Select Category Image"
              previewClassName="h-40"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Update Category" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
