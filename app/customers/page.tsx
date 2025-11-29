import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Customer } from "./columns";

async function getData(): Promise<Customer[]> {
  return [
    { id: "1", name: "Alice", email: "alice@example.com", phone: 111111111 },
    { id: "2", name: "Bob", email: "bob@example.com", phone: 222222222 },
    { id: "3", name: "Charlie", email: "charlie@example.com", phone: 333333333 },
    { id: "4", name: "Diana", email: "diana@example.com", phone: 444444444 },
    { id: "5", name: "Eve", email: "eve@example.com", phone: 555555555 },
    { id: "6", name: "Frank", email: "frank@example.com", phone: 666666666 },
    { id: "7", name: "Grace", email: "grace@example.com", phone: 777777777 },
    { id: "8", name: "Heidi", email: "heidi@example.com", phone: 888888888 },
    { id: "9", name: "Ivan", email: "ivan@example.com", phone: 999999999 },
    { id: "10", name: "Judy", email: "judy@example.com", phone: 1010101010 },
    { id: "11", name: "Frank", email: "frank@example.com", phone: 666666666 },
    { id: "12", name: "Grace", email: "grace@example.com", phone: 777777777 },
    { id: "13", name: "Heidi", email: "heidi@example.com", phone: 888888888 },
    { id: "14", name: "Ivan", email: "ivan@example.com", phone: 999999999 },
    { id: "15", name: "Judy", email: "judy@example.com", phone: 1010101010 },
  ];
}

const Customers = async () => {
  const data = await getData();

  return (
    <div className="p-10 w-[94%] mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Customers</h1>
      <p className="mb-6">Here is a list of all CUSTOMERS</p>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default Customers;
