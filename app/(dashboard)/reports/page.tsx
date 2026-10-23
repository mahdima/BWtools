import { DashboardFilter } from "@/components/dashboard-filter";
import { BestSellers } from "@/components/best-sellers";
import { SalesBarList } from "@/components/sales-bar-list";
import { getSalesReport } from "@/lib/data/reports";
import { topWithOther } from "@/lib/reports";
import { getTranslations } from "next-intl/server";

interface ReportsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Sales reports for a dashboard period (P7-02). Read-only, so every admin role sees it.
export default async function ReportsPage({ searchParams }: ReportsProps) {
  const params = await searchParams;
  const period = typeof params.period === "string" ? params.period : "all";

  const [sales, t] = await Promise.all([getSalesReport(period), getTranslations("reports")]);

  return (
    <div className="flex h-full w-full flex-col space-y-4 overflow-auto p-4 ps-16 lg:ps-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t("intro")}</p>
        </div>
        <DashboardFilter />
      </div>

      <div className="grid grid-cols-1 gap-4 pb-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <BestSellers rows={sales.product.slice(0, 10)} />
        </div>
        <SalesBarList
          title={t("byCategory")}
          description={t("everyCategory")}
          missingLabel={t("missingCategory")}
          rows={topWithOther(sales.category, 8)}
        />
        <SalesBarList
          title={t("byBrand")}
          description={t("everyBrand")}
          missingLabel={t("missingBrand")}
          rows={topWithOther(sales.brand, 8)}
        />
      </div>
    </div>
  );
}
