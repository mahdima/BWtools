import React, { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { columns, Order } from "./columns";
import { getOrders } from "@/lib/data/orders";
import { CsvExporter } from "@/components/csv-exporter";
import { OrderDateFilter } from "@/components/order-date-filter";
import { exportOrders } from "./actions";
import { OrderBulkActions } from "./bulk-actions";
import { getCurrentAdmin } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import { ORDER_STATUSES } from "@/lib/orders";
import { getTranslations } from "next-intl/server";

interface OrderPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const OrderPage = async ({ searchParams }: OrderPageProps) => {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;
  const filters = { search, status, from, to };
  const limit = 20;

  const [{ data, count }, admin, t, statuses] = await Promise.all([
    getOrders({ page, limit, ...filters }),
    getCurrentAdmin(),
    getTranslations("orders"),
    getTranslations("orderStatus"),
  ]);
  // Viewers are read-only: no row selection for them
  const canEdit = hasRole(admin?.role, "admin");
  const pageCount = Math.ceil(count / limit);

  return (
    <div className="flex flex-col h-full p-4 ps-16 lg:ps-4 w-full overflow-auto">
      <Suspense fallback={null}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="status"
          searchPlaceholder={t("searchPlaceholder")}
          title={t("title")}
          description={t("subtitle")}
          filterTabs={[
            {
              column: "status",
              tabs: [
                { label: t("all"), value: "All" },
                ...ORDER_STATUSES.map((value) => ({ label: statuses(value), value })),
              ],
            },
          ]}
          rowLinkPath="/order"
          pageCount={pageCount}
          isServerSide={true}
          bulkActions={canEdit ? <OrderBulkActions /> : undefined}
          headerActions={
            <>
              <OrderDateFilter />
              <CsvExporter action={exportOrders.bind(null, filters)} />
            </>
          }
        />
      </Suspense>
    </div>
  );
};

export default OrderPage;

