"use client";

import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";

import { deleteProduct } from "@/app/(dashboard)/addproduct/actions";
import Link from "next/link";

export type Product = {
  id: string;
  product: string;
  category: string;
  price: number;
  brand: string;
  in_stock_vailable: boolean;
};

export const columns: ColumnDef<Product>[] = [
  {
    id: "serial",
    header: () => <div className="w-10">N°</div>,
    cell: ({ row }) => <div className="w-10 text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "id",
    header: () => <div className="w-16">Product ID</div>,
    cell: ({ row }) => (
      <div className="w-16 text-center">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "product",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-64 justify-start pl-0 hover:bg-transparent"
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="w-64 truncate" title={row.getValue("product")}>
        {row.getValue("product")}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-40 justify-start pl-0 hover:bg-transparent"
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="w-40 truncate" title={row.getValue("category")}>
        {row.getValue("category")}
      </div>
    ),
  },
  {
    accessorKey: "brand",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-32 justify-start pl-0 hover:bg-transparent"
        >
          Brand
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="w-32 truncate" title={row.getValue("brand")}>
        {row.getValue("brand")}
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-32 justify-start pl-0 hover:bg-transparent"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("fr-DZ", {
        style: "currency",
        currency: "DZD",
      }).format(amount);

      return (
        <div className="w-32 font-medium" suppressHydrationWarning>
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: "in_stock_vailable",
    header: () => <div className="w-32">Stock</div>,
    cell: ({ row }) => {
      const isAvailable = row.getValue("in_stock_vailable");
      return (
        <div
          className={`w-32 font-medium ${isAvailable ? "text-green-600" : "text-red-600"
            }`}
        >
          {isAvailable ? "Available" : "Out of Stock"}
        </div>
      );
    },
  },

  {
    id: "actions",
    header: () => <div className="text-center">Action</div>,
    cell: ({ row }) => {
      const product = row.original;

      return (
        <div className="flex justify-center gap-2">
          <Link href={`/product?edit=${product.id}`}>
            <Button
              className="bg-green-500 hover:bg-green-400 text-white h-8 w-19"
            >
              <Pencil className="h-4 w-4 mr-0" /> Edit
            </Button>
          </Link>
          <Button
            onClick={() => deleteProduct(product.id)}
            className="bg-red-500 hover:bg-red-700 text-white h-8 w-20"
          >
            <Trash2 className="h-4 w-4 mr-0" /> Delete
          </Button>
        </div>
      );
    },
  },
];
