import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { ProductImport } from "@/components/product-import";
import { MAX_IMPORT_ROWS } from "@/lib/product-import";
import { getProductFormOptions } from "@/lib/data/products";

// CSV import of products (P7-03), for admins.
export default async function ProductImportPage() {
  await requireAdminPage("admin");
  const { categories, brands } = await getProductFormOptions();

  return (
    <div className="flex h-full w-full flex-col space-y-4 overflow-auto p-4 pl-16 lg:pl-4">
      <div className="py-2">
        <Link href="/product" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Import products</h1>
        <div className="mt-2 max-w-3xl space-y-1 text-sm text-gray-600">
          <p>
            Upload a CSV file (comma or semicolon separated, as Excel saves it) whose first row names the columns:{" "}
            <strong>name</strong>, <strong>price</strong>, <strong>category</strong> and <strong>brand</strong> are
            required; <strong>quantity</strong> and <strong>description</strong> are optional. French headers (nom,
            prix, stock, catégorie, marque) work too.
          </p>
          <p>
            Give a category or brand by its name or its id; it must already exist. Products whose name is already in
            the catalogue are skipped. At most {MAX_IMPORT_ROWS} rows per file. Add images afterwards by editing each
            product.
          </p>
        </div>
      </div>
      <ProductImport
        exampleCategory={categories[0]?.categorie_name ?? "Category name"}
        exampleBrand={brands[0]?.brand_name ?? "Brand name"}
      />
    </div>
  );
}
