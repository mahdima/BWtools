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
        "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-md ring-1 ring-blue-700/50",
      iconClass: "bg-white/20 text-white backdrop-blur-sm",
      textClass: "text-blue-50",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      description: "All time orders",
      className: "bg-white",
      iconClass: "bg-orange-100/50 text-orange-600",
      textClass: "text-muted-foreground",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      description: "In catalog",
      className: "bg-white",
      iconClass: "bg-emerald-100/50 text-emerald-600",
      textClass: "text-muted-foreground",
    },
    {
      title: "Active Brands",
      value: stats.totalBrands.toString(),
      icon: Tag,
      description: "Partner brands",
      className: "bg-white",
      iconClass: "bg-violet-100/50 text-violet-600",
      textClass: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <div
          key={stat.title}
          className={cn(
            "rounded-2xl border shadow-sm p-6 transition-all hover:shadow-md",
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
            <div className={cn("p-2.5 rounded-xl", stat.iconClass)}>
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
                  stat.textClass === "text-blue-50"
                    ? "text-blue-200"
                    : "text-green-500"
                )}
              />
              <p
                className={cn("text-xs font-medium opacity-90", stat.textClass)}
              >
                {stat.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
