import React, { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { columns, Product } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { Can } from "@/components/admin-provider";
import { ArchiveViewLink } from "@/components/archive-view-link";
import { getCurrentAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/data/settings";
import { hasRole } from "@/lib/roles";
import { ProductForm } from "@/components/ProductForm";
import { addProduct, updateProduct } from "./actions";
import { ProductBulkActions } from "./bulk-actions";
import { getProductById, getProductFormOptions, getProducts } from "@/lib/data/products";

export const revalidate = 0;

interface ProductPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ProductPage = async ({ searchParams }: ProductPageProps) => {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const search = typeof params.search === "string" ? params.search : "";
  // ?stock=low lists only products at or below the store's low-stock threshold
  const lowStockOnly = params.stock === "low";
  const lowStockAtOrBelow = lowStockOnly ? (await getStoreSettings()).low_stock_threshold : undefined;
  // ?view=archived lists archived products (P6-08)
  const archived = params.view === "archived";
  const limit = 20;

  const { data, count, archiving } = await getProducts({ page, limit, search, lowStockAtOrBelow, archived });
  const pageCount = Math.ceil(count / limit);

  // The add/edit modal is only for admins (viewers are read-only)
  const canEdit = hasRole((await getCurrentAdmin())?.role, "admin");
  const showAddModal = canEdit && params.add === "true";
  const editId = canEdit ? (params.edit as string | undefined) : undefined;

  // Only load what the add/edit modal needs when it is open. The pickers keep the edited
  // product's own category and brand even if those were archived.
  const productToEdit = editId ? await getProductById(Number(editId)) : null;
  const { categories, brands } =
    showAddModal || editId
      ? await getProductFormOptions(
          productToEdit ? { categoryId: productToEdit.Category_id, brandId: productToEdit.brand_id } : undefined,
        )
      : { categories: [], brands: [] };

  return (
    <div className="flex flex-col h-full p-4 ps-16 lg:ps-4 w-full overflow-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="product"
          title={archived ? "Archived products" : "Products"}
          description={
            archived
              ? "Hidden from the catalogue, kept for past orders"
              : "Manage your product catalog"
          }
          pageCount={pageCount}
          isServerSide={true}
          bulkActions={canEdit ? <ProductBulkActions archived={archived} /> : undefined}
          headerActions={
            <>
            {archiving && <ArchiveViewLink href="/product" archived={archived} />}
            {!archived && (
            <>
            <Link
              href={lowStockOnly ? "/product" : "/product?stock=low"}
              className="text-sm font-medium text-primary hover:text-primary-strong whitespace-nowrap"
            >
              {lowStockOnly ? "Show all products" : "Low stock only"}
            </Link>
            <Can minRole="admin">
              <Link
                href="/product/import"
                className="inline-flex h-[40px] items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" /> Import
              </Link>
              <Link
                href={`/product?add=true${
                  params.page ? `&page=${params.page}` : ""
                }`}
              >
                <Button className="bg-primary text-white hover:bg-primary-strong w-[180px] h-[40px]">
                  <Plus className="me-2 h-4 w-4" /> Add Product
                </Button>
              </Link>
            </Can>
            </>
            )}
            </>
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

