import {
  Package,
  ShoppingCart,
  Tag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDA } from "@/lib/money";
import { formatPercentChange } from "@/lib/reports";

interface StatsCardsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalBrands: number;
  };
  // Change against the previous period in percent (null: nothing to compare with).
  // Omitted for "all time".
  comparison?: {
    label: string; // e.g. "vs previous 7 days"
    revenue: number | null;
    orders: number | null;
  } | null;
}

// "+12% vs previous 7 days" with an arrow; up is good for both revenue and orders.
function Delta({ change, label, onAccent }: { change: number | null; label: string; onAccent: boolean }) {
  if (change === null) {
    return (
      <p className={cn("text-xs font-medium", onAccent ? "text-primary-foreground/80" : "text-muted-foreground")}>
        No earlier data to compare
      </p>
    );
  }

  const text = formatPercentChange(change);
  const direction = text === "0%" ? "flat" : change > 0 ? "up" : "down";
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  // On the blue card colour can't carry meaning, so the arrow and sign do
  const tone = onAccent
    ? "text-white"
    : direction === "up"
      ? "text-emerald-600"
      : direction === "down"
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <p className={cn("flex items-center gap-1.5 text-xs font-medium", onAccent ? "text-primary-foreground/90" : "text-muted-foreground")}>
      <Icon className={cn("h-4 w-4", tone)} aria-hidden />
      <span className={cn("font-semibold", tone)}>{text}</span>
      <span>{label}</span>
    </p>
  );
}

export function StatsCards({ stats, comparison }: StatsCardsProps) {
  const statItems = [
    {
      title: "Total Revenue",
      value: formatDA(stats.totalRevenue),
      icon: DollarSign,
      description: "Total earnings",
      change: comparison ? comparison.revenue : undefined,
      onAccent: true,
      className:
        "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg shadow-primary/20",
      iconClass: "bg-white/20 text-white backdrop-blur-md",
      textClass: "text-primary-foreground/90",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      description: "All time orders",
      change: comparison ? comparison.orders : undefined,
      onAccent: false,
      className: "glass-card hover:border-primary/20",
      iconClass:
        "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
      textClass: "text-muted-foreground",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      description: "In catalog",
      change: undefined,
      onAccent: false,
      className: "glass-card hover:border-primary/20",
      iconClass:
        "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
      textClass: "text-muted-foreground",
    },
    {
      title: "Active Brands",
      value: stats.totalBrands.toString(),
      icon: Tag,
      description: "Partner brands",
      change: undefined,
      onAccent: false,
      className: "glass-card hover:border-primary/20",
      iconClass:
        "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
      textClass: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <div
          key={stat.title}
          className={cn(
            "rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
            stat.className
          )}
        >
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3
              className={cn(
                "tracking-tight text-sm font-medium",
                stat.textClass
              )}
            >
              {stat.title}
            </h3>
            <div
              className={cn("p-3 rounded-xl transition-colors", stat.iconClass)}
            >
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight">
              {stat.value}
            </div>
            <div className="mt-2">
              {comparison && stat.change !== undefined ? (
                <Delta change={stat.change} label={comparison.label} onAccent={stat.onAccent} />
              ) : (
                <p className={cn("text-xs font-medium", stat.textClass)}>
                  {stat.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
