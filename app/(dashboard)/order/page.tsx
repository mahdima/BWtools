import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Order } from "./columns";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getData(): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')



  if (error) {
    console.error('Error fetching orders:', error);
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
    <div className="p-5 w-[94%] mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Orders</h1>
      <p className="mb-6">Here is a list of all ORDERS</p>
      <DataTable
        columns={columns}
        data={data}
        searchKey="status"
        filterTabs={[
          {
            column: "status",
            tabs: [
              { label: "New", value: "New" },
              { label: "Cancelled", value: "Cancelled" },
              { label: "Delivered", value: "Delivered" },
            ],
          },
        ]}
      />
    </div>
  );
};

export default OrderPage;