"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTableSelection } from "@/components/table-selection";
import { countLabel } from "@/lib/bulk";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { updateOrdersStatus } from "./actions";

// Bulk status change for the selected orders (P7-03). Each order gets its own status
// history entry, as if changed one by one.
export function OrderBulkActions() {
  const { selectedIds } = useTableSelection();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const orders = countLabel(selectedIds.length, "order");

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="bulk-status" className="text-gray-600">
        Set status
      </label>
      <select
        id="bulk-status"
        value={status}
        onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
        className="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm"
      >
        <option value="">Choose…</option>
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </option>
        ))}
      </select>
      <ConfirmDialog
        title={`Mark ${orders} as ${status}?`}
        description="Each order's status history records the change and who made it."
        confirmLabel="Change status"
        destructive={status === "Cancelled"}
        action={() => updateOrdersStatus(selectedIds.map(Number), status)}
        trigger={
          <Button size="sm" className="h-8 bg-primary text-white hover:bg-primary-strong" disabled={!status}>
            Apply
          </Button>
        }
      />
    </div>
  );
}
