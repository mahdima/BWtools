"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

// SVG attributes can't read CSS variables reliably, so the chart picks its colours here
const CHART_COLORS = {
  light: { grid: "#E5E7EB", axis: "#6B7280", bar: "#0B1DFF", tooltip: "#FFFFFF", text: "#111827" },
  dark: { grid: "#27304A", axis: "#9CA3AF", bar: "#6B7BFF", tooltip: "#161C2E", text: "#F3F4F6" },
};

interface RevenueChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const t = useTranslations("dashboard");
  const colors = CHART_COLORS[useTheme().resolvedTheme === "dark" ? "dark" : "light"];
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col items-center justify-center h-[350px]">
        <h3 className="text-lg font-bold text-foreground mb-2">
          {t("revenueOverview")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("noRevenue")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 h-full min-h-[300px] flex flex-col">
      <h3 className="text-lg font-bold text-foreground mb-4">{t("revenueOverview")}</h3>
      {/* Time runs left to right in every language */}
      <div
        dir="ltr"
        className="flex-1 w-full min-h-0"
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={colors.grid}
            />
            <XAxis
              dataKey="name"
              stroke={colors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              stroke={colors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                background: colors.tooltip,
                color: colors.text,
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar
              dataKey="total"
              fill={colors.bar}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
