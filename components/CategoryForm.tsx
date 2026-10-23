"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  addCategory,
  updateCategory,
} from "@/app/(dashboard)/categories/actions";
import { ProductImageUpload } from "@/components/ProductImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFormAction } from "@/lib/use-form-action";
import { useTranslations } from "next-intl";

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
  trigger?: React.ReactNode;
}

export function CategoryForm({ category, trigger }: CategoryFormProps) {
  const t = useTranslations("categories");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" /> {t("addCategory")}
          </button>
        )}
      </DialogTrigger>
      {/* Radix mounts the content on open, so each open starts without an old error */}
      <DialogContent className="sm:max-w-md bg-white" aria-describedby={undefined}>
        <CategoryFormBody category={category} onDone={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CategoryFormBody({
  category,
  onDone,
}: {
  category?: CategoryFormProps["category"];
  onDone: () => void;
}) {
  const isEdit = !!category;
  const t = useTranslations("categories");
  const tc = useTranslations("common");
  const image = useTranslations("image");
  const { state, isPending, onSubmit } = useFormAction(async (_prev, formData) => {
    const result = await (isEdit ? updateCategory : addCategory)(formData);
    if (result.success) {
      onDone();
      toast.success(result.message);
    }
    return result;
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        {isEdit && <input type="hidden" name="id" value={category.id} />}

        {state && !state.success && (
          <div role="alert" className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {state.message}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="categoryName" className="text-sm font-medium text-gray-700">
            {t("form.name")}
          </label>
          <input
            id="categoryName"
            name="categoryName"
            defaultValue={category?.name || ""}
            required
            autoFocus
            className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-sm"
            placeholder={t("form.namePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t("form.image")}</span>
          <ProductImageUpload
            name="categoryImage"
            defaultValue={category?.imageUrl}
            label={image("selectCategoryImage")}
            previewClassName="h-40"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {tc("cancel")}
          </button>
          <button
            disabled={isPending}
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? t("form.update") : t("form.add")}
          </button>
        </div>
      </form>
    </>
  );
}
