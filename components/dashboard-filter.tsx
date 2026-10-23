"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { PERIODS, isPeriod } from "@/lib/dates";

export function DashboardFilter() {
  const router = useRouter();
  const pathname = usePathname(); // the dashboard and the Reports page share this filter
  const searchParams = useSearchParams();
  const t = useTranslations("dashboard");
  const requested = searchParams.get("period");
  const currentPeriod = isPeriod(requested) ? requested : "all";

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="relative w-[180px]">
      <div className="flex items-center justify-between w-full h-10 px-3 py-2 bg-card border border-border rounded-lg shadow-sm transition-all hover:border-muted-foreground/40 hover:bg-muted/40">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground/80">
            {t(`periods.${currentPeriod}`)}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
      </div>
      <select
        aria-label={t("periodLabel")}
        value={currentPeriod}
        onChange={(e) => handleValueChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {PERIODS.map((period) => (
          <option key={period} value={period}>
            {t(`periods.${period}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
