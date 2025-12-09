import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Product } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getData(): Promise<Product[]> {
  return [
    { id: "PROD-001", product: "Wireless Mouse", category: "Electronics", price: 29.99, brand: "Logitech" },
    { id: "PROD-002", product: "Mechanical Keyboard", category: "Electronics", price: 129.99, brand: "Keychron" },
    { id: "PROD-003", product: "Monitor 24 inch", category: "Electronics", price: 199.99, brand: "Dell" },
    { id: "PROD-004", product: "USB-C Hub", category: "Accessories", price: 49.99, brand: "Anker" },
    { id: "PROD-005", product: "Laptop Stand", category: "Accessories", price: 39.99, brand: "Rain Design" },
    { id: "PROD-006", product: "Webcam 1080p", category: "Electronics", price: 79.99, brand: "Logitech" },
    { id: "PROD-007", product: "Noise Cancelling Headphones", category: "Audio", price: 299.99, brand: "Sony" },
    { id: "PROD-008", product: "Bluetooth Speaker", category: "Audio", price: 59.99, brand: "JBL" },
    { id: "PROD-009", product: "External SSD 1TB", category: "Storage", price: 149.99, brand: "Samsung" },
    { id: "PROD-010", product: "Gaming Chair", category: "Furniture", price: 249.99, brand: "Secretlab" },
  ];
}

const ProductPage = async () => {
  const data = await getData();

  return (
    <div className="p-10 w-[94%] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Products</h1>
          <p>Here is a list of all PRODUCTS</p>
        </div>
        <Link href="/addproduct ">
          <Button className="bg-[#0B1DFF] w-[180px] h-[40px]">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default ProductPage;
