import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Category } from "./columns";
import { CategoryForm } from "@/components/CategoryForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
async function getData(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("categorie_id");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  if (data && data.length > 0) {
    console.log("Raw category data from DB (first item):", data[0]);
  }

  return (data || []).map((item: any) => ({
    id: item.categorie_id,
    category: item.categorie_name,
  }));
}

const CategoriesPage = async () => {
  const data = await getData();

  return (
    <div className="p-4 w-[98%] mx-auto">
      <div className="mb-4 mt-5">
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500">Manage your product categories</p>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="category"
        headerActions={
          <CategoryForm
            trigger={
              <Button className="bg-[#0b1dff] text-white hover:bg-blue-700 w-[180px] h-[40px]">
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            }
          />
        }
      />
    </div>
  );
};

export default CategoriesPage;
