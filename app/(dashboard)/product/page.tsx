import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Product } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Modal } from "@/components/Modal";
import { ProductForm } from "@/components/ProductForm";
import { addProduct, updateProduct } from "../addproduct/actions";

async function getData(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(categorie_name), brands(brand_name)")
    .order("product_id");

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.product_id,
    product: item.product_name,
    category: item.categories?.categorie_name || "",
    price: item.unite_price,
    brand: item.brands?.brand_name || "",
    in_stock_vailable: item.in_stock_vailable,
  }));
}

async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("product_id", parseInt(id))
    .single();

  if (error || !data) return null;
  return data;
}

async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("categorie_id, categorie_name")
    .order("categorie_name");
  if (error) return [];
  return data || [];
}

async function getBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("brand_id, brand_name")
    .order("brand_name");
  if (error) return [];
  return data || [];
}

interface ProductPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ProductPage = async ({ searchParams }: ProductPageProps) => {
  const data = await getData();
  const params = await searchParams;
  const showAddModal = params.add === "true";
  const editId = params.edit as string;

  let productToEdit = null;
  let categories: any[] = [];
  let brands: any[] = [];

  if (showAddModal || editId) {
    categories = await getCategories();
    brands = await getBrands();
  }

  if (editId) {
    productToEdit = await getProduct(editId);
  }

  return (
    <div className="p-4 w-[98%] mx-auto">
      <div className="mb-4 mt-5">
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Products</h1>
        <p className="text-sm text-gray-500">Manage your product catalog</p>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="product"
        headerActions={
          <Link href="/product?add=true">
            <Button className="bg-[#0b1dff] text-white hover:bg-blue-700 w-[180px] h-[40px]">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </Link>
        }
      />

      {(showAddModal || (editId && productToEdit)) && (
        <Modal>
          <ProductForm
            key={editId || "add-product"}
            categories={categories}
            brands={brands}
            product={productToEdit}
            action={editId ? updateProduct.bind(null, editId) : addProduct}
            title={editId ? "Edit Product" : "Add New Product"}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProductPage;
