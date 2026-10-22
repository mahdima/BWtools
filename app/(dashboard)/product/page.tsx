import React, { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { columns, Product } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { ProductForm } from "@/components/ProductForm";
import { addProduct, updateProduct } from "./actions";
import { getProductById, getProductFormOptions, getProducts } from "@/lib/data/products";

export const revalidate = 0;

interface ProductPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ProductPage = async ({ searchParams }: ProductPageProps) => {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const search = typeof params.search === "string" ? params.search : "";
  const limit = 20;

  const { data, count } = await getProducts({ page, limit, search });
  const pageCount = Math.ceil(count / limit);

  const showAddModal = params.add === "true";
  const editId = params.edit as string;

  // Only load what the add/edit modal needs when it is open
  const [productToEdit, formOptions] = await Promise.all([
    editId ? getProductById(Number(editId)) : null,
    showAddModal || editId ? getProductFormOptions() : { categories: [], brands: [] },
  ]);
  const { categories, brands } = formOptions;

  return (
    <div className="flex flex-col h-full p-4 pl-16 lg:pl-4 w-full overflow-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="product"
          title="Products"
          description="Manage your product catalog"
          pageCount={pageCount}
          isServerSide={true}
          headerActions={
            <Link
              href={`/product?add=true${
                params.page ? `&page=${params.page}` : ""
              }`}
            >
              <Button className="bg-primary text-white hover:bg-primary-strong w-[180px] h-[40px]">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </Link>
          }
        />
      </Suspense>

      {(showAddModal || (editId && productToEdit)) && (
        <Modal
          returnUrl={`/product${params.page ? `?page=${params.page}` : ""}`}
          title={editId ? "Edit Product" : "Add New Product"}
        >
          <ProductForm
            key={editId || "add-product"}
            categories={categories}
            brands={brands}
            product={productToEdit}
            action={editId ? updateProduct.bind(null, editId) : addProduct}
            title={editId ? "Edit Product" : "Add New Product"}
            page={params.page}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProductPage;

