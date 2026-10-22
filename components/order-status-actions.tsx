"use client";

import { useTransition } from "react";
import { Box, Truck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { updateOrderStatus } from "@/app/(dashboard)/order/actions";
import type { OrderStatus } from "@/lib/orders";
import { runWithToast } from "@/lib/toast-action";

const STATUS_BUTTONS: { status: OrderStatus; label: string; icon: LucideIcon; className: string }[] = [
  { status: "New", label: "Mark as New", icon: Box, className: "hover:bg-green-50 hover:text-green-700 hover:border-green-200" },
  { status: "processing", label: "Mark as Processing", icon: Box, className: "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200" },
  { status: "Delivering", label: "Mark as Delivering", icon: Truck, className: "hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200" },
  { status: "Delivered", label: "Mark as Delivered", icon: Truck, className: "hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200" },
  { status: "Cancelled", label: "Mark as Cancelled", icon: Box, className: "hover:bg-red-50 hover:text-red-700 hover:border-red-200" },
];

interface OrderStatusActionsProps {
  orderId: number;
  currentStatus: string | null;
}

export function OrderStatusActions({ orderId, currentStatus }: OrderStatusActionsProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {STATUS_BUTTONS.map(({ status, label, icon: Icon, className }) => {
        const button = (
          <Button
            variant="outline"
            className={`w-full justify-start ${className}`}
            disabled={isPending || currentStatus === status}
            onClick={
              status === "Cancelled"
                ? undefined
                : () => startTransition(async () => void (await runWithToast(() => updateOrderStatus(orderId, status))))
            }
          >
            <Icon className="h-4 w-4 mr-2" /> {label}
          </Button>
        );

        // Cancelling is the one change customers notice, so ask first
        return status === "Cancelled" ? (
          <ConfirmDialog
            key={status}
            title={`Cancel order #${orderId}?`}
            description="The order will be marked as Cancelled and excluded from revenue. You can change the status again later."
            confirmLabel="Cancel order"
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
