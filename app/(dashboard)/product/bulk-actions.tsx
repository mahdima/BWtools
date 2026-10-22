"use client";

import { ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTableSelection } from "@/components/table-selection";
import { countLabel } from "@/lib/bulk";
import { deleteProducts, restoreProducts } from "./actions";

// Bulk actions for the selected products (P7-03): delete in the catalogue view,
// restore in the Archived view. The list refreshes, and the selection clears, after.
export function ProductBulkActions({ archived }: { archived: boolean }) {
  const { selectedIds } = useTableSelection();
  const products = countLabel(selectedIds.length, "product");

  if (archived) {
    return (
      <ConfirmDialog
        title={`Restore ${products}?`}
        description="They return to the catalogue and the product pickers."
        confirmLabel="Restore"
        action={() => restoreProducts(selectedIds)}
        trigger={
          <Button variant="outline" size="sm" className="h-8 gap-1 bg-background">
            <ArchiveRestore className="h-3.5 w-3.5" /> Restore
          </Button>
        }
      />
    );
  }

  return (
    <ConfirmDialog
      title={`Delete ${products}?`}
      description="Products that no order or favorite uses are removed permanently. The others are archived instead, and can be restored from Archived."
      confirmLabel="Delete"
      destructive
      action={() => deleteProducts(selectedIds)}
      trigger={
        <Button variant="outline" size="sm" className="h-8 gap-1 bg-background text-red-600 hover:text-red-700">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      }
    />
  );
}
