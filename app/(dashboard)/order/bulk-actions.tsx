"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTableSelection } from "@/components/table-selection";
import { useTranslations } from "next-intl";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { updateOrdersStatus } from "./actions";

// Bulk status change for the selected orders (P7-03). Each order gets its own status
// history entry, as if changed one by one.
export function OrderBulkActions() {
  const { selectedIds } = useTableSelection();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const t = useTranslations("orders.bulk");
  const statuses = useTranslations("orderStatus");

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="bulk-status" className="text-muted-foreground">
        {t("setStatus")}
      </label>
      <select
        id="bulk-status"
        value={status}
        onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
        className="h-8 rounded-md border border-border bg-card px-2 text-sm"
      >
        <option value="">{t("choose")}</option>
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {statuses(value)}
          </option>
        ))}
      </select>
      <ConfirmDialog
        title={t("title", { count: selectedIds.length, status: status ? statuses(status) : "" })}
        description={t("text")}
        confirmLabel={t("confirm")}
        destructive={status === "Cancelled"}
        action={() => updateOrdersStatus(selectedIds.map(Number), status)}
        trigger={
          <Button size="sm" className="h-8 bg-primary text-white hover:bg-primary-strong" disabled={!status}>
            {t("apply")}
          </Button>
        }
      />
    </div>
  );
}
