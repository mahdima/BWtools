"use client";

import { ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTableSelection } from "@/components/table-selection";
import { useTranslations } from "next-intl";
import { deleteProducts, restoreProducts } from "./actions";

// Bulk actions for the selected products (P7-03): delete in the catalogue view,
// restore in the Archived view. The list refreshes, and the selection clears, after.
export function ProductBulkActions({ archived }: { archived: boolean }) {
  const { selectedIds } = useTableSelection();
  const t = useTranslations("products");
  const tArchive = useTranslations("archive");
  const count = selectedIds.length;

  if (archived) {
    return (
      <ConfirmDialog
        title={t("bulkRestoreTitle", { count })}
        description={t("bulkRestoreText")}
        confirmLabel={tArchive("restore")}
        action={() => restoreProducts(selectedIds)}
        trigger={
          <Button variant="outline" size="sm" className="h-8 gap-1 bg-background">
            <ArchiveRestore className="h-3.5 w-3.5" /> {tArchive("restore")}
          </Button>
        }
      />
    );
  }

  return (
    <ConfirmDialog
      title={t("bulkDeleteTitle", { count })}
      description={t("bulkDeleteText")}
      confirmLabel={t("deleteConfirm")}
      destructive
      action={() => deleteProducts(selectedIds)}
      trigger={
        <Button variant="outline" size="sm" className="h-8 gap-1 bg-background text-red-600 dark:text-red-400 hover:text-red-700">
          <Trash2 className="h-3.5 w-3.5" /> {t("deleteConfirm")}
        </Button>
      }
    />
  );
}
