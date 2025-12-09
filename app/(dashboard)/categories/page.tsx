import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Category } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getData(): Promise<Category[]> {
    return [
        { id: "CAT-001", category: "Electronics", brand: "Generic" },
        { id: "CAT-002", category: "Clothing", brand: "FashionBrand" },
        { id: "CAT-003", category: "Home & Garden", brand: "HomeStyle" },
        { id: "CAT-004", category: "Sports", brand: "Sporty" },
        { id: "CAT-005", category: "Toys", brand: "FunTime" },
    ];
}

const CategoriesPage = async () => {
    const data = await getData();

    return (
        <div className="p-10 w-[94%] mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Categories</h1>
                    <p>Here is a list of all CATEGORIES</p>
                </div>
                <Link href="/addcategory">
                    <Button className="bg-[#0B1DFF] w-[180px] h-[40px]">
                        <Plus className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                </Link>
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    );
};

export default CategoriesPage;
