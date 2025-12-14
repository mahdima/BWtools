import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Order } from "./columns";
import { supabase } from "@/lib/supabaseClient";

async function getData(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles(username), products(id),order_items(quantity),order_items(created_at)')
    .order('id');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Map the database columns to the Product interface
  // Assuming the DB has a 'name' column for the product name to match the 'product' field in the table
  return (data || []).map((item: any) => ({
    id: item.id,
    status: item.status,
    category: item.categories?.categorie_name || 'Null',
    price: item.unite_price,
    brand: item.brands?.brand_name || 'Null',
  }));
}

const OrderPage = async () => {
  const data = await getData();

  return (
    <div className="p-5 w-[94%] mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Orders</h1>
      <p className="mb-6">Here is a list of all ORDERS</p>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default OrderPage;
