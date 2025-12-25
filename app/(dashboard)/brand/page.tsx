import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Brand } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Modal } from "@/components/Modal";
import { BrandForm } from "@/components/BrandForm";
import { addBrand, updateBrand } from "./actions";

async function getData(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("brand_id");

  if (error) {
    console.error("Error fetching brands:", error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.brand_id,
    brand: item.brand_name,
  }));
}

async function getBrand(id: string) {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("brand_id", parseInt(id))
    .single();

  if (error || !data) return null;
  return data;
}

interface BrandPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const BrandPage = async ({ searchParams }: BrandPageProps) => {
  const data = await getData();
  const params = await searchParams;
  const showAddModal = params.add === "true";
  const editId = params.edit as string;

  let brandToEdit = null;

  if (editId) {
    brandToEdit = await getBrand(editId);
  }

  return (
    <div className="p-4 w-[98%] mx-auto">
      <div className="mb-4 mt-5">
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Brands</h1>
        <p className="text-sm text-gray-500">Manage product brands</p>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="brand"
        headerActions={
          <Link href="/brand?add=true">
            <Button className="bg-[#0b1dff] text-white hover:bg-blue-700 w-[180px] h-[40px]">
              <Plus className="mr-2 h-4 w-4" /> Add Brand
            </Button>
          </Link>
        }
      />

      {(showAddModal || (editId && brandToEdit)) && (
        <Modal>
          <BrandForm
            key={editId || "add-brand"}
            brand={brandToEdit}
            action={editId ? updateBrand.bind(null, editId) : addBrand}
            title={editId ? "Edit Brand" : "Add New Brand"}
          />
        </Modal>
      )}
    </div>
  );
};

export default BrandPage;
