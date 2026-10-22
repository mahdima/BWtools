import { describe, expect, it } from "vitest";
import {
  descriptionToHtml,
  normalizeName,
  parseImportNumber,
  readProductImport,
  type ImportLookup,
} from "@/lib/product-import";

const lookup: ImportLookup = {
  categories: [
    { categorie_id: 1, categorie_name: "OUTILLAGE" },
    { categorie_id: 2, categorie_name: "Outils agricoles" },
  ],
  brands: [
    { brand_id: 7, brand_name: "Bosch" },
    { brand_id: 8, brand_name: "Sans Marque" },
  ],
  existingNames: new Set([normalizeName("Marteau 300g")]),
};

describe("parseImportNumber", () => {
  it("reads French and English number formats", () => {
    expect(parseImportNumber("1200")).toBe(1200);
    expect(parseImportNumber("1 200,50")).toBe(1200.5);
    expect(parseImportNumber("1,200.50")).toBe(1200.5);
    expect(parseImportNumber("12.5")).toBe(12.5);
    expect(parseImportNumber("")).toBeUndefined();
    expect(Number.isNaN(parseImportNumber("cheap"))).toBe(true);
  });
});

describe("descriptionToHtml", () => {
  it("makes escaped paragraphs from lines", () => {
    expect(descriptionToHtml("18V drill\n\n<b>2 batteries</b>")).toBe("<p>18V drill</p><p>&lt;b&gt;2 batteries&lt;/b&gt;</p>");
    expect(descriptionToHtml("  ")).toBeUndefined();
  });
});

describe("readProductImport", () => {
  it("validates rows and resolves categories and brands by name or id", () => {
    const { error, rows } = readProductImport(
      [
        "Nom;Prix;Stock;Catégorie;Marque;Description",
        "Perceuse 18V;12 500;4;outillage;bosch;Sans fil",
        "Pelle;900;;2;8;",
      ].join("\n"),
      lookup,
    );
    expect(error).toBeUndefined();
    expect(rows.map((row) => row.errors)).toEqual([[], []]);
    expect(rows[0]).toMatchObject({ row: 2, category: "OUTILLAGE", brand: "Bosch" });
    expect(rows[0].values).toEqual({
      product_name: "Perceuse 18V",
      Category_id: 1,
      brand_id: 7,
      unite_price: 12500,
      in_stock_vailable: 4,
      description: "<p>Sans fil</p>",
    });
    expect(rows[1].values).toMatchObject({ Category_id: 2, brand_id: 8, in_stock_vailable: 0, description: undefined });
  });

  it("reports every problem of a row and keeps it out of the import", () => {
    const { rows } = readProductImport(
      [
        "name,price,quantity,category,brand",
        ",-5,2.5,Garden,",
        "Marteau 300G,100,1,1,7",
        "Clé,100,1,1,7",
        "clé ,100,1,1,7",
      ].join("\n"),
      lookup,
    );
    expect(rows[0].errors).toEqual([
      'Unknown category "Garden".',
      "Brand is missing.",
      "Product name is required.",
      "Price must be greater than 0.",
      "Quantity must be a whole number.",
    ]);
    expect(rows[0].values).toBeNull();
    expect(rows[1].errors).toEqual(["A product with this name already exists."]);
    expect(rows[2].errors).toEqual([]);
    expect(rows[3].errors).toEqual(["This name appears more than once in the file."]);
  });

  it("rejects files without the required columns or rows", () => {
    expect(readProductImport("name,quantity\nDrill,3", lookup).error).toBe(
      "Missing columns: price, category, brand. The first row must name the columns: name, price, quantity, category, brand, description.",
    );
    expect(readProductImport("name,price,category,brand\n", lookup).error).toBe("The file has no products.");
    expect(readProductImport("", lookup).error).toBe("The file has no products.");
  });

  it("caps the number of rows", () => {
    const text = ["name,price,category,brand", ...Array.from({ length: 501 }, (_, i) => `P${i},10,1,7`)].join("\n");
    expect(readProductImport(text, lookup).error).toBe("The file has 501 products; import at most 500 at a time.");
  });
});
