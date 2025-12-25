"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Order = {
    id: string
    total: number
    created_at: string
    status: string
}

export const columns: ColumnDef<Order>[] = [
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("total"))
            const formatted = new Intl.NumberFormat("fr-DZ", {
                style: "currency",
                currency: "DZD",
            }).format(amount)
            return <div className="font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <div className={`font-medium ${status === "New" ? "text-green-600" :
                    status === "Cancelled" ? "text-red-800" :
                        status === "Delivered" ? "text-orange-600" : "text-gray-600"
                    }`}>
                    {status}
                </div>
            )
        }
    },
    {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at"))
            return <div>{date.toLocaleDateString()}</div>
        },
    },


    {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
            const order = row.original

            return (
                <div className="flex items-center gap-2">
                    <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <Link href={`/order/${order.id}`}>
                            Order Detail
                        </Link>
                    </Button>
                    <DropdownMenu>





                    </DropdownMenu>
                </div >
            )

        },
    },
]