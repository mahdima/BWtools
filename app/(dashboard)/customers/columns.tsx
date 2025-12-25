"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Link from "next/link";
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Customer = {
    id: string
    username: string
    email: string
    phone: number

}

export const columns: ColumnDef<Customer>[] = [

    {
        accessorKey: "username",
        header: "Username",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "phone",
        header: "Phone",
    },

    {
        id: "actions",
        header: () => <div className="text-center">Action</div>,
        cell: ({ row }) => {
            const customer = row.original

            return (
                <div className="flex justify-center gap-2">
                    <Link href={`/addcustomer?edit=${customer.id}`}>
                        <Button
                            className="bg-green-500 hover:bg-green-400 text-white h-8 w-19"
                        >
                            <Pencil className="h-4 w-4 mr-0" /> Edit
                        </Button>
                    </Link>
                    <Button
                        className="bg-red-500 hover:bg-red-700 text-white h-8 w-20"
                    >
                        <Trash2 className="h-4 w-4 mr-0" /> Delete
                    </Button>
                </div>
            )
        },
    },
]
