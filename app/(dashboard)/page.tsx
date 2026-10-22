import { StatsCards } from "@/components/stats-cards";
import { RecentOrders } from "@/components/recent-orders";
import { LowStock } from "@/components/low-stock";
import { DashboardFilter } from "@/components/dashboard-filter";
import { RevenueChart } from "@/components/revenue-chart";
import { getDashboardStats, getLowStockProducts, getRecentOrders, getRevenueData } from "@/lib/data/dashboard";
import { getStoreSettings } from "@/lib/data/settings";
import { getPreviousPeriodTotals } from "@/lib/data/reports";
import { percentChange } from "@/lib/reports";
import { isPeriod } from "@/lib/dates";
import { intlLocale } from "@/lib/i18n";
import { getLocale, getTranslations } from "next-intl/server";

export const revalidate = 0; // Ensure fresh data on every request

interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: DashboardProps) {
  const params = await searchParams;
  const period = isPeriod(params.period) ? params.period : "all";
  const [t, locale] = await Promise.all([getTranslations("dashboard"), getLocale()]);

  const [stats, previous, recentOrders, revenueData, lowStock] = await Promise.all([
    getDashboardStats(period),
    getPreviousPeriodTotals(period),
    getRecentOrders(),
    getRevenueData(period, intlLocale(locale)),
    getStoreSettings().then(async ({ low_stock_threshold }) => ({
      threshold: low_stock_threshold,
      ...(await getLowStockProducts(low_stock_threshold)),
    })),
  ]);

  // Change against the window just before the period (none for "all time")
  const comparison = previous && period !== "all" ? {
    label: t(`comparison.${period}`),
    revenue: percentChange(stats.totalRevenue, previous.revenue),
    orders: percentChange(stats.totalOrders, previous.orders),
  } : null;

  return (
    <div className="p-4 ps-16 lg:ps-4 w-full lg:w-[98%] mx-auto h-[calc(100vh-2rem)] flex flex-col space-y-4 overflow-auto">
      <div className="flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500">
            {t("subtitle")}
          </p>
        </div>
        <DashboardFilter />
      </div>

      <div className="flex-none">
        <StatsCards stats={stats} comparison={comparison} />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
        {/* Chart, recent orders and low stock; wraps to two columns on smaller screens */}
        <div className="h-full min-h-[320px]">
          <RevenueChart data={revenueData} />
        </div>
        <div className="h-full min-h-[320px]">
          <RecentOrders orders={recentOrders} />
        </div>
        <div className="h-full min-h-[320px]">
          <LowStock products={lowStock.products} total={lowStock.total} threshold={lowStock.threshold} />
        </div>
      </div>
    </div>
  );
}

