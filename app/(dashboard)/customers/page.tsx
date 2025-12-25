import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Customer } from "./columns";
import { supabase } from "@/lib/supabaseClient";

async function getData(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("profiles_with_email")
    .select("*");

  if (error) {
    console.error("Error fetching CUSTOMERS:", error);
    return [];
  }

  // Map the database columns to the Product interface
  // Assuming the DB has a 'name' column for the product name to match the 'product' field in the table
  return (data || []).map((item: any) => ({
    id: item.id,
    username: item.username, // Allow nulls
    email: item.email,
    phone: item.phone,
  }));
}

const CustomersPage = async () => {
  const data = await getData();

  return (
    <div className="p-4 w-[98%] mx-auto">
      <div className="mb-4 mt-5">
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">
          View and manage customer details
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="username"
        // No headerActions (add button removed)
      />
    </div>
  );
};

export default CustomersPage;
