import React, { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { columns, Brand } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getBrandById, getBrands } from "@/lib/data/brands";
import { Modal } from "@/components/Modal";
import { Can } from "@/components/admin-provider";
import { ArchiveViewLink } from "@/components/archive-view-link";
import { getCurrentAdmin } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import { BrandForm } from "@/components/BrandForm";
import { addBrand, updateBrand } from "./actions";

interface BrandPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const BrandPage = async ({ searchParams }: BrandPageProps) => {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const search = typeof params.search === "string" ? params.search : "";
  // ?view=archived lists archived brands (P6-08)
  const archived = params.view === "archived";
  const limit = 20;
  // The add/edit modal is only for admins (viewers are read-only)
  const canEdit = hasRole((await getCurrentAdmin())?.role, "admin");
  const showAddModal = canEdit && params.add === "true";
  const editId = canEdit ? (params.edit as string | undefined) : undefined;

  const [{ data, count, archiving }, brandToEdit] = await Promise.all([
    getBrands({ page, limit, search, archived }),
    editId ? getBrandById(Number(editId)) : null,
  ]);

  return (
    <div className="flex flex-col h-full p-4 pl-16 lg:pl-4 w-full overflow-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="brand"
          pageCount={Math.ceil(count / limit)}
          isServerSide={true}
          title={archived ? "Archived brands" : "Brands"}
          description={archived ? "Used only by archived products" : "Manage product brands"}
          headerActions={
            <>
              {archiving && <ArchiveViewLink href="/brand" archived={archived} />}
              {!archived && (
                <Can minRole="admin">
                  <Link href="/brand?add=true">
                    <Button className="bg-primary text-white hover:bg-primary-strong w-[180px] h-[40px]">
                      <Plus className="mr-2 h-4 w-4" /> Add Brand
                    </Button>
                  </Link>
                </Can>
              )}
            </>
          }
        />
      </Suspense>

      {(showAddModal || (editId && brandToEdit)) && (
        <Modal returnUrl="/brand" title={editId ? "Edit Brand" : "Add New Brand"}>
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

