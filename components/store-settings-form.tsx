"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateStoreSettings } from "@/app/(dashboard)/settings/actions";
import type { StoreSettings } from "@/lib/store-settings";
import { useFormAction } from "@/lib/use-form-action";

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-primary transition-all text-sm";

const FIELDS: { name: keyof StoreSettings; label: string; type?: string; help?: string }[] = [
  { name: "store_name", label: "Store name" },
  { name: "contact_email", label: "Contact email", type: "email" },
  { name: "contact_phone", label: "Contact phone" },
  { name: "address", label: "Address", help: "Shown in the invoice header." },
  { name: "low_stock_threshold", label: "Low-stock threshold", type: "number", help: "Products at or below this quantity count as low stock." },
  { name: "invoice_footer", label: "Invoice footer" },
];

// Super admins edit the store-wide settings (Settings > General).
export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const { state, isPending, onSubmit } = useFormAction(async (prev, formData) => {
    const result = await updateStoreSettings(prev, formData);
    if (result.success) toast.success(result.message);
    return result;
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {FIELDS.map(({ name, label, type, help }) => (
        <div key={name} className="grid grid-cols-3 items-start gap-4">
          <label htmlFor={`store-${name}`} className="text-sm font-medium text-gray-500 pt-2.5">
            {label}
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
              <p id={`store-${name}-help`} className="text-xs text-gray-400">
                {help}
              </p>
            )}
          </div>
        </div>
      ))}

      {state && !state.success && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
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
          Save store settings
        </button>
      </div>
    </form>
  );
}
