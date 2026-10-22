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

  const [{ data, count }, admin] = await Promise.all([getOrders({ page, limit, ...filters }), getCurrentAdmin()]);
  // Viewers are read-only: no row selection for them
  const canEdit = hasRole(admin?.role, "admin");
  const pageCount = Math.ceil(count / limit);

  return (
    <div className="flex flex-col h-full p-4 pl-16 lg:pl-4 w-full overflow-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="status"
          searchPlaceholder="Order #, customer, email or phone"
          title="Orders"
          description="Manage and track customer orders"
          filterTabs={[
            {
              column: "status",
              tabs: [
                { label: "All", value: "All" },
                { label: "New", value: "New" },
                { label: "Processing", value: "processing" },
                { label: "Delivering", value: "Delivering" },
                { label: "Delivered", value: "Delivered" },
                { label: "Cancelled", value: "Cancelled" },
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

