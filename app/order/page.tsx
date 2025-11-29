import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Order } from "./columns";

async function getData(): Promise<Order[]> {
  return [
    { id: "ORD-001", product: "Wireless Mouse", qty: 2, date: "2023-10-01", price: 59.98, status: "Completed" },
    { id: "ORD-002", product: "Mechanical Keyboard", qty: 1, date: "2023-10-02", price: 129.99, status: "Processing" },
    { id: "ORD-003", product: "Monitor 24 inch", qty: 1, date: "2023-10-03", price: 199.99, status: "Pending" },
    { id: "ORD-004", product: "USB-C Hub", qty: 3, date: "2023-10-04", price: 149.97, status: "Completed" },
    { id: "ORD-005", product: "Laptop Stand", qty: 1, date: "2023-10-05", price: 39.99, status: "Cancelled" },
    { id: "ORD-006", product: "Webcam 1080p", qty: 1, date: "2023-10-06", price: 79.99, status: "Completed" },
    { id: "ORD-007", product: "Noise Cancelling Headphones", qty: 1, date: "2023-10-07", price: 299.99, status: "Processing" },
    { id: "ORD-008", product: "Bluetooth Speaker", qty: 2, date: "2023-10-08", price: 119.98, status: "Pending" },
    { id: "ORD-009", product: "External SSD 1TB", qty: 1, date: "2023-10-09", price: 149.99, status: "Completed" },
    { id: "ORD-010", product: "Gaming Chair", qty: 1, date: "2023-10-10", price: 249.99, status: "Completed" },
  ];
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
