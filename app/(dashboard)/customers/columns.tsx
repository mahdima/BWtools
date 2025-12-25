"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/CustomerForm";

export type Customer = {
  id: string;
  username: string;
  email: string;
  phone: string;
};

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => {
      const val = row.getValue("username") as string;
      return val && val !== "Null" ? (
        <span className="font-medium text-gray-900">{val}</span>
      ) : (
        <span className="text-gray-400">-</span>
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

      return (
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
                className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      );
    },
  },
];
