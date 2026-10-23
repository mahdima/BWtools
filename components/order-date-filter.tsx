"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

const inputClass =
  "h-8 rounded-md border border-gray-200 bg-background px-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none";

// From/to date pickers for the order list, kept in the URL (?from=YYYY-MM-DD&to=...)
// like the other filters, so reload, Back and the CSV export all see them.
export function OrderDateFilter() {
  const t = useTranslations("orders");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const setDates = (next: { from?: string; to?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // back to the first page
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor="order-from" className="sr-only">
        {t("fromDate")}
      </label>
      <input
        id="order-from"
        type="date"
        value={from}
        max={to || undefined}
        onChange={(e) => setDates({ from: e.target.value })}
        className={inputClass}
      />
      <span className="text-gray-400" aria-hidden>
        –
      </span>
      <label htmlFor="order-to" className="sr-only">
        {t("toDate")}
      </label>
      <input
        id="order-to"
        type="date"
        value={to}
        min={from || undefined}
        onChange={(e) => setDates({ to: e.target.value })}
        className={inputClass}
      />
      {(from || to) && (
        <Button variant="ghost" size="sm" className="h-8" onClick={() => setDates({ from: "", to: "" })}>
          {t("clearDates")}
        </Button>
      )}
    </div>
  );
}
