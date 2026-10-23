"use client";

import { useTransition } from "react";
import { Box, Truck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { updateOrderStatus } from "@/app/(dashboard)/order/actions";
import type { OrderStatus } from "@/lib/orders";
import { useRunWithToast } from "@/lib/use-toast-action";
import { useTranslations } from "next-intl";

const STATUS_BUTTONS: { status: OrderStatus; icon: LucideIcon; className: string }[] = [
  { status: "New", icon: Box, className: "hover:bg-green-500/10 hover:text-green-700 hover:border-green-500/30" },
  { status: "processing", icon: Box, className: "hover:bg-blue-500/10 hover:text-primary-strong hover:border-blue-500/30" },
  { status: "Delivering", icon: Truck, className: "hover:bg-yellow-500/10 hover:text-yellow-700 hover:border-yellow-500/30" },
  { status: "Delivered", icon: Truck, className: "hover:bg-orange-500/10 hover:text-orange-700 hover:border-orange-500/30" },
  { status: "Cancelled", icon: Box, className: "hover:bg-red-500/10 hover:text-red-700 hover:border-red-500/30" },
];

interface OrderStatusActionsProps {
  orderId: number;
  currentStatus: string | null;
}

export function OrderStatusActions({ orderId, currentStatus }: OrderStatusActionsProps) {
  const t = useTranslations("orders.statusActions");
  const runToast = useRunWithToast();
  const statuses = useTranslations("orderStatus");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {STATUS_BUTTONS.map(({ status, icon: Icon, className }) => {
        const button = (
          <Button
            variant="outline"
            className={`w-full justify-start ${className}`}
            disabled={isPending || currentStatus === status}
            onClick={
              status === "Cancelled"
                ? undefined
                : () => startTransition(async () => void (await runToast(() => updateOrderStatus(orderId, status))))
            }
          >
            <Icon className="h-4 w-4 me-2" /> {t("mark", { status: statuses(status) })}
          </Button>
        );

        // Cancelling is the one change customers notice, so ask first
        return status === "Cancelled" ? (
          <ConfirmDialog
            key={status}
            title={t("cancelTitle", { id: orderId })}
            description={t("cancelText")}
            confirmLabel={t("cancelConfirm")}
            destructive
            action={() => updateOrderStatus(orderId, status)}
            trigger={button}
          />
        ) : (
          <div key={status}>{button}</div>
        );
      })}
    </div>
  );
}
