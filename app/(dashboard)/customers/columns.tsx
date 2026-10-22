"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Can } from "@/components/admin-provider";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/CustomerForm";

export type Customer = {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
};

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "username",
    header: "Username",
    // Links to the customer page (a link here rather than a clickable row, so the
    // edit button in the same row doesn't also navigate)
    cell: ({ row }) => {
      const val = row.getValue("username") as string | null;
      const label = val && val !== "Null" ? val : row.original.email || "View customer";
      return (
        <Link href={`/customers/${row.original.id}`} className="font-medium text-gray-900 hover:text-primary hover:underline">
          {label}
        </Link>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const val = row.getValue("email") as string;
      return val && val !== "Null" ? (
        val
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const val = row.getValue("phone") as string;
      // Ensure it's not the string "Null" if that's what comes from DB view still
      return val && val !== "Null" ? (
        val
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  },

  {
    id: "actions",
    header: () => <div className="text-center">Action</div>,
    cell: ({ row }) => {
      const customer = row.original;

      // Viewers are read-only; the server actions check the role too
      return (
        <Can minRole="admin">
        <div className="flex justify-center gap-2">
          <CustomerForm
            customer={{
              id: customer.id,
              username: customer.username || "",
              email: customer.email || "",
              phone: customer.phone ? customer.phone.toString() : "",
            }}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${customer.username || customer.email || "customer"}`}
                className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
        </div>
        </Can>
      );
    },
  },
];
