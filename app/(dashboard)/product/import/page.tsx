import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { ProductImport } from "@/components/product-import";
import { MAX_IMPORT_ROWS } from "@/lib/product-import";
import { getProductFormOptions } from "@/lib/data/products";
import { getTranslations } from "next-intl/server";

// CSV import of products (P7-03), for admins.
export default async function ProductImportPage() {
  await requireAdminPage("admin");
  const [{ categories, brands }, t] = await Promise.all([getProductFormOptions(), getTranslations("products.import")]);

  return (
    <div className="flex h-full w-full flex-col space-y-4 overflow-auto p-4 ps-16 lg:ps-4">
      <div className="py-2">
        <Link href="/product" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("back")}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <div className="mt-2 max-w-3xl space-y-1 text-sm text-muted-foreground">
          <p>{t("intro1")}</p>
          <p>{t("intro2", { max: MAX_IMPORT_ROWS })}</p>
        </div>
      </div>
      <ProductImport
        exampleCategory={categories[0]?.categorie_name ?? t("exampleCategory")}
        exampleBrand={brands[0]?.brand_name ?? t("exampleBrand")}
      />
    </div>
  );
}
