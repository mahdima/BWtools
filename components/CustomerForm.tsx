"use client";

import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCustomer } from "@/app/(dashboard)/customers/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFormAction } from "@/lib/use-form-action";
import { useTranslations } from "next-intl";

interface CustomerFormProps {
  customer: {
    id: string;
    username: string;
    email: string;
    phone: string;
  };
  trigger?: React.ReactNode;
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-sm";

export function CustomerForm({ customer, trigger }: CustomerFormProps) {
  const t = useTranslations("customers.form");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="text-muted-foreground hover:text-primary" aria-label={t("title")}>
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </DialogTrigger>
      {/* Radix mounts the content on open, so each open starts without an old error */}
      <DialogContent className="sm:max-w-md bg-card" aria-describedby={undefined}>
        <CustomerFormBody customer={customer} onDone={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CustomerFormBody({
  customer,
  onDone,
}: {
  customer: CustomerFormProps["customer"];
  onDone: () => void;
}) {
  const t = useTranslations("customers.form");
  const tc = useTranslations("common");
  const { state, isPending, onSubmit } = useFormAction(async (_prev, formData) => {
    const result = await updateCustomer(formData);
    if (result.success) {
      onDone();
      toast.success(result.message);
    }
    return result;
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="id" value={customer.id} />

        {state && !state.success && (
          <div role="alert" className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
            {state.message}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="customer-email" className="text-sm font-medium text-foreground/80">
            {t("emailReadOnly")}
          </label>
          <input
            id="customer-email"
            disabled
            defaultValue={customer.email}
            className="w-full h-10 px-3 rounded-lg border border-border bg-muted/60 text-muted-foreground text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="customer-username" className="text-sm font-medium text-foreground/80">
            {t("username")}
          </label>
          <input
            id="customer-username"
            name="username"
            defaultValue={customer.username || ""}
            className={inputClass}
            placeholder={t("usernamePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="customer-phone" className="text-sm font-medium text-foreground/80">
            {t("phone")}
          </label>
          <input
            id="customer-phone"
            name="phone"
            defaultValue={customer.phone || ""}
            className={inputClass}
            placeholder="+213..."
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            {tc("cancel")}
          </button>
          <button
            disabled={isPending}
            type="submit"
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-strong disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("update")}
          </button>
        </div>
      </form>
    </>
  );
}
