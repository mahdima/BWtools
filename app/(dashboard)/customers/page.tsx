import React, { Suspense } from "react";
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
    <div className="flex flex-col h-full p-4 pl-16 lg:pl-4 w-full overflow-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="username"
          title="Customers"
          description="View and manage customer details"
        />
      </Suspense>
    </div>
  );
};

export default CustomersPage;

