import React, { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { getCustomers } from "@/lib/data/customers";

interface CustomersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const CustomersPage = async ({ searchParams }: CustomersPageProps) => {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const search = typeof params.search === "string" ? params.search : "";
  const limit = 20;

  const { data, count } = await getCustomers({ page, limit, search });
  const pageCount = Math.ceil(count / limit);

  return (
    <div className="flex flex-col h-full p-4 pl-16 lg:pl-4 w-full overflow-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="username"
          searchPlaceholder="Username, email or phone"
          title="Customers"
          description="View and manage customer details"
          pageCount={pageCount}
          isServerSide={true}
        />
      </Suspense>
    </div>
  );
};

export default CustomersPage;

