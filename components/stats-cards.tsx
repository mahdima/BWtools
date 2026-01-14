import {
  Package,
  ShoppingCart,
  Truck,
  Tag,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalBrands: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statItems = [
    {
      title: "Total Revenue",
      value: new Intl.NumberFormat("fr-DZ", {
        style: "currency",
        currency: "DZD",
        maximumFractionDigits: 0,
      })
        .format(stats.totalRevenue)
        .replace("DZD", "DA"),
      icon: DollarSign,
      description: "Total earnings",
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
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp
                className={cn(
                  "h-4 w-4",
                  stat.textClass === "text-primary-foreground/90"
                    ? "text-white/80"
                    : "text-emerald-500"
                )}
              />
              <p className={cn("text-xs font-medium", stat.textClass)}>
                {stat.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
