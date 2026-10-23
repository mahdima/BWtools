"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Can } from "@/components/admin-provider";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/CustomerForm";
import { useTranslations } from "next-intl";

export type Customer = {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
};

// Column titles are components so they can use translations (TanStack renders them)
function ColumnLabel({ k }: { k: "username" | "email" | "phone" | "action" }) {
  return useTranslations("customers.columns")(k);
}

function CustomerLink({ customer }: { customer: Customer }) {
  const t = useTranslations("customers");
  const name = customer.username && customer.username !== "Null" ? customer.username : null;
  return (
    <Link href={`/customers/${customer.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
      {name || customer.email || t("viewCustomer")}
    </Link>
  );
}

function CustomerActions({ customer }: { customer: Customer }) {
  const t = useTranslations("customers");
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
              aria-label={t("edit", { name: customer.username || customer.email || t("editFallback") })}
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-blue-500/10"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </Can>
  );
}

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "username",
    header: () => <ColumnLabel k="username" />,
    // Links to the customer page (a link here rather than a clickable row, so the
    // edit button in the same row doesn't also navigate)
    cell: ({ row }) => <CustomerLink customer={row.original} />,
  },
  {
    accessorKey: "email",
    header: () => <ColumnLabel k="email" />,
    cell: ({ row }) => {
      const val = row.getValue("email") as string;
      return val && val !== "Null" ? (
        val
      ) : (
        <span className="text-muted-foreground/70">-</span>
      );
    },
  },
  {
    accessorKey: "phone",
    header: () => <ColumnLabel k="phone" />,
    cell: ({ row }) => {
      const val = row.getValue("phone") as string;
      // Ensure it's not the string "Null" if that's what comes from DB view still
      return val && val !== "Null" ? (
        <span dir="ltr">{val}</span>
      ) : (
        <span className="text-muted-foreground/70">-</span>
      );
    },
  },

  {
    id: "actions",
    header: () => (
      <div className="text-center">
        <ColumnLabel k="action" />
      </div>
    ),
    cell: ({ row }) => <CustomerActions customer={row.original} />,
  },
];
