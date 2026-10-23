"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateStoreSettings } from "@/app/(dashboard)/settings/actions";
import type { StoreSettings } from "@/lib/store-settings";
import { useFormAction } from "@/lib/use-form-action";
import { useTranslations } from "next-intl";

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-sm";

// label and help are keys in messages/*.json "settings"
const FIELDS: {
  name: keyof StoreSettings;
  label: "storeName" | "contactEmail" | "contactPhone" | "address" | "lowStockThreshold" | "invoiceFooter";
  type?: string;
  help?: "addressHelp" | "lowStockHelp";
}[] = [
  { name: "store_name", label: "storeName" },
  { name: "contact_email", label: "contactEmail", type: "email" },
  { name: "contact_phone", label: "contactPhone" },
  { name: "address", label: "address", help: "addressHelp" },
  { name: "low_stock_threshold", label: "lowStockThreshold", type: "number", help: "lowStockHelp" },
  { name: "invoice_footer", label: "invoiceFooter" },
];

// Super admins edit the store-wide settings (Settings > General).
export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const t = useTranslations("settings");
  const { state, isPending, onSubmit } = useFormAction(async (prev, formData) => {
    const result = await updateStoreSettings(prev, formData);
    if (result.success) toast.success(result.message);
    return result;
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {FIELDS.map(({ name, label, type, help }) => (
        <div key={name} className="grid grid-cols-3 items-start gap-4">
          <label htmlFor={`store-${name}`} className="text-sm font-medium text-muted-foreground pt-2.5">
            {t(label)}
          </label>
          <div className="col-span-2 space-y-1">
            <input
              id={`store-${name}`}
              name={name}
              type={type ?? "text"}
              min={type === "number" ? 0 : undefined}
              defaultValue={settings[name] ?? ""}
              required={name !== "contact_phone" && name !== "address" && name !== "invoice_footer"}
              className={inputClass}
              aria-describedby={help ? `store-${name}-help` : undefined}
            />
            {help && (
              <p id={`store-${name}-help`} className="text-xs text-muted-foreground/70">
                {t(help)}
              </p>
            )}
          </div>
        </div>
      ))}

      {state && !state.success && (
        <div role="alert" className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
          {state.message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-strong disabled:opacity-50 flex items-center gap-2"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("saveStore")}
        </button>
      </div>
    </form>
  );
}
