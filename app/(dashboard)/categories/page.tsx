import React, { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { columns, Category } from "./columns";
import { CategoryForm } from "@/components/CategoryForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getCategories } from "@/lib/data/categories";
const CategoriesPage = async () => {
  const data = await getCategories();

  return (
    <div className="flex flex-col h-full p-4 pl-16 lg:pl-4 w-full overflow-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="category"
          title="Categories"
          description="Manage your product categories"
          headerActions={
            <CategoryForm
              trigger={
                <Button className="bg-primary text-white hover:bg-primary-strong w-[180px] h-[40px]">
                  <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
              }
            />
          }
        />
      </Suspense>
    </div>
  );
};

export default CategoriesPage;

