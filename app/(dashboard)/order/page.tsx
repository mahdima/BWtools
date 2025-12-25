import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Order } from "./columns";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getData(): Promise<Order[]> {
  const { data, error } = await supabaseAdmin.from("orders").select("*");

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    created_at: item.created_at,
    total: item.total,
    status: item.status,
  }));
}

const OrderPage = async () => {
  const data = await getData();

  return (
    <div className="p-4 w-[98%] mx-auto">
      <div className="mb-4 mt-5">
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">
          Manage and track customer orders
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="status"
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
      />
    </div>
  );
};

export default OrderPage;
