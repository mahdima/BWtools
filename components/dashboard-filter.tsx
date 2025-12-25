"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get("period") || "all";

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }
    router.push(`/?${params.toString()}`);
  };

  const periodLabels: Record<string, string> = {
    all: "All Time",
    last_week: "Last Week",
    last_month: "Last Month",
    last_3_months: "Last 3 Months",
    last_year: "Last Year",
  };

  return (
    <div className="relative w-[180px]">
      <div className="flex items-center justify-between w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {periodLabels[currentPeriod] || "Select Period"}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
      <select
        value={currentPeriod}
        onChange={(e) => handleValueChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        <option value="all">All Time</option>
        <option value="last_week">Last Week</option>
        <option value="last_month">Last Month</option>
        <option value="last_3_months">Last 3 Months</option>
        <option value="last_year">Last Year</option>
      </select>
    </div>
  );
}
