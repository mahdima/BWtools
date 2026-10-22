import { DashboardFilter } from "@/components/dashboard-filter";
import { BestSellers } from "@/components/best-sellers";
import { SalesBarList } from "@/components/sales-bar-list";
import { getSalesReport } from "@/lib/data/reports";
import { topWithOther } from "@/lib/reports";

interface ReportsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Sales reports for a dashboard period (P7-02). Read-only, so every admin role sees it.
export default async function ReportsPage({ searchParams }: ReportsProps) {
  const params = await searchParams;
  const period = typeof params.period === "string" ? params.period : "all";

  const sales = await getSalesReport(period);

  return (
    <div className="flex h-full w-full flex-col space-y-4 overflow-auto p-4 ps-16 lg:ps-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="max-w-2xl text-sm text-gray-500">
            Sales are order lines at the price paid, from orders that weren&apos;t cancelled. They don&apos;t include
            delivery, so they add up to less than the dashboard&apos;s revenue.
          </p>
        </div>
        <DashboardFilter />
      </div>

      <div className="grid grid-cols-1 gap-4 pb-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <BestSellers rows={sales.product.slice(0, 10)} />
        </div>
        <SalesBarList
          title="Sales by category"
          description="Every category with sales in this period"
          rows={topWithOther(sales.category, 8)}
        />
        <SalesBarList
          title="Sales by brand"
          description="Every brand with sales in this period"
          rows={topWithOther(sales.brand, 8)}
        />
      </div>
    </div>
  );
}
