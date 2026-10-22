import React, { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { columns, Customer } from "./columns";
import { getCustomers } from "@/lib/data/customers";

const CustomersPage = async () => {
  const data = await getCustomers();

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

