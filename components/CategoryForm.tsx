"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Pencil, Loader2, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import {
  addCategory,
  updateCategory,
} from "@/app/(dashboard)/categories/actions";

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
  };
  trigger?: React.ReactNode;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      type="submit"
      className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {isEdit ? "Update Category" : "Add Category"}
    </button>
  );
}

export function CategoryForm({ category, trigger }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const isEdit = !!category;

  useEffect(() => {
    setMounted(true);
  }, []);

  async function clientAction(formData: FormData) {
    setMessage(null);
    const action = isEdit ? updateCategory : addCategory;
    const result = await action(formData);

    if (result.success) {
      setIsOpen(false);
    } else {
      setMessage(result.message);
    }
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger || (
          <button className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
      </div>

      {isOpen &&
        mounted &&
        createPortal(
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
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form action={clientAction} className="p-6 space-y-4">
                {isEdit && (
                  <input type="hidden" name="id" value={category.id} />
                )}

                {message && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category Name
                  </label>
                  <input
                    name="categoryName"
                    defaultValue={category?.name || ""}
                    required
                    autoFocus
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-sm"
                    placeholder="e.g., Tools"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <SubmitButton isEdit={isEdit} />
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
