import { StatsCards } from "@/components/stats-cards";
import { RecentOrders } from "@/components/recent-orders";
import { LowStock } from "@/components/low-stock";
import { DashboardFilter } from "@/components/dashboard-filter";
import { RevenueChart } from "@/components/revenue-chart";
import {
  getDashboardStats,
  getRecentOrders,
  getLowStockProducts,
  getRevenueData,
} from "./actions";

export const revalidate = 0; // Ensure fresh data on every request

interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: DashboardProps) {
  const params = await searchParams;
  const period = typeof params.period === "string" ? params.period : "all";

  const stats = await getDashboardStats(period);
  const recentOrders = await getRecentOrders();
  // const lowStockProducts = await getLowStockProducts();
  const revenueData = await getRevenueData(period);

  return (
    <div className="p-4 pl-16 lg:pl-4 w-full lg:w-[98%] mx-auto h-[calc(100vh-2rem)] flex flex-col space-y-4 overflow-auto">
      <div className="flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Overview of your store's performance
          </p>
        </div>
        <DashboardFilter />
      </div>

      <div className="flex-none">
        <StatsCards stats={stats} />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
        {/* Split: Left Chart, Right Recents */}
        <div className="h-full min-h-0">
          <RevenueChart data={revenueData} />
        </div>
        <div className="h-full min-h-0">
          <RecentOrders orders={recentOrders} />
        </div>
      </div>
    </div>
  );
}

