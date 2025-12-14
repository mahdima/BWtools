import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Product } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

import { supabase } from "@/lib/supabaseClient";

async function getData(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(categorie_name), brands(brand_name)')
    .order('product_id');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Map the database columns to the Product interface
  // Assuming the DB has a 'name' column for the product name to match the 'product' field in the table
  return (data || []).map((item: any) => ({
    id: item.product_id,
    product: item.product_name,
    category: item.categories?.categorie_name || 'Null',
    price: item.unite_price,
    brand: item.brands?.brand_name || 'Null',
  }));
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
