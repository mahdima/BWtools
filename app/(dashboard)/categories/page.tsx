import React, { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { columns, Category } from "./columns";
import { CategoryForm } from "@/components/CategoryForm";
import { Can } from "@/components/admin-provider";
import { ArchiveViewLink } from "@/components/archive-view-link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getCategories } from "@/lib/data/categories";
import { getTranslations } from "next-intl/server";

interface CategoriesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const CategoriesPage = async ({ searchParams }: CategoriesPageProps) => {
  // ?view=archived lists archived categories (P6-08)
  const archived = (await searchParams).view === "archived";
  const [{ data, archiving }, t] = await Promise.all([getCategories({ archived }), getTranslations("categories")]);

  return (
    <div className="flex flex-col h-full p-4 ps-16 lg:ps-4 w-full overflow-auto">
      <Suspense fallback={null}>
        <DataTable
          columns={columns}
          data={data}
          searchKey="category"
          title={archived ? t("archivedTitle") : t("title")}
          description={archived ? t("archivedSubtitle") : t("subtitle")}
          headerActions={
            <>
              {archiving && <ArchiveViewLink href="/categories" archived={archived} />}
              {!archived && (
                <Can minRole="admin">
                  <CategoryForm
                    trigger={
                      <Button className="bg-primary text-white hover:bg-primary-strong w-[180px] h-[40px]">
                        <Plus className="me-2 h-4 w-4" /> {t("addCategory")}
                      </Button>
                    }
                  />
                </Can>
              )}
            </>
          }
        />
      </Suspense>
    </div>
  );
};

export default CategoriesPage;

