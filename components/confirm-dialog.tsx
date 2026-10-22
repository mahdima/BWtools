"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { runWithToast } from "@/lib/toast-action";
import { useTranslations } from "next-intl";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  // Runs after the user confirms; its result is shown as a toast.
  action: () => Promise<ActionResult>;
  // Element that opens the dialog. Omit it and pass `open`/`onOpenChange` to
  // open the dialog from elsewhere (e.g. a dropdown menu item).
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  action,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Keep the dialog open while the action is running
        if (!isPending) setOpen(next);
      }}
    >
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className={destructive ? buttonVariants({ variant: "destructive" }) : undefined}
            onClick={(event) => {
              // Don't let Radix close the dialog before the action has finished
              event.preventDefault();
              startTransition(async () => {
                await runWithToast(action);
                setOpen(false);
              });
            }}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel ?? t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
