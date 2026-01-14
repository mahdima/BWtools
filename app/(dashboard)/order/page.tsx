import React, { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { columns, Order } from "./columns";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOrders } from "../actions";
import { CsvExporter } from "@/components/csv-exporter";

interface OrderPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const OrderPage = async ({ searchParams }: OrderPageProps) => {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";
  const limit = 20;

  const { data, count } = await getOrders({ page, limit, search, status });
  const pageCount = Math.ceil(count / limit);

  return (
    <div className="flex flex-col h-full p-4 pl-16 lg:pl-4 w-full overflow-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="status"
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
          headerActions={<CsvExporter data={data} filename="orders.csv" />}
        />
      </Suspense>
    </div>
  );
};

export default OrderPage;

